-- ============================================
-- 1. Tipo de documento base para personas
-- ============================================
INSERT INTO "agape_app_development_demo"."core_identity_document_type"
    ("code", "name", "is_enabled", "applies_to_person", "applies_to_company")
VALUES
    ('CC', 'Cédula de ciudadanía', true, true, false),
    ('NIT', 'Número de Identificación Tributaria', true, false, true),
    ('CE', 'Cédula de extranjería', true, true, false),
    ('TI', 'Tarjeta de identidad', true, true, false),
    ('PA', 'Pasaporte', true, true, false),
    ('RC', 'Registro civil', true, true, false)
ON CONFLICT ("code") DO NOTHING;


-- ============================================
-- 2. Usuario ROOT / empleado / usuario de acceso
--    (actualizado al nuevo modelo)
-- ============================================
BEGIN;

WITH person_doc_type AS (
    SELECT id AS document_type_id
    FROM "agape_app_development_demo"."core_identity_document_type"
    WHERE code = 'CC'
),

-- 1) Usuario base (sin email/phone/address; ahora van a core_contact_method / core_address)
upsert_user AS (
    INSERT INTO "agape_app_development_demo"."user"
        (user_type, document_type_id, document_number, country_code, language_code, currency_code, is_active)
    SELECT
        'person',
        person_doc_type.document_type_id,
        '000000000000',
        'CO',
        'es',
        'COP',
        true
    FROM person_doc_type
    ON CONFLICT (document_type_id, document_number)
    DO UPDATE SET
        user_type      = EXCLUDED.user_type,
        country_code   = EXCLUDED.country_code,
        language_code  = EXCLUDED.language_code,
        currency_code  = EXCLUDED.currency_code,
        is_active      = EXCLUDED.is_active,
        updated_at     = now()
    RETURNING id
),

-- 2) core_person (PK = user.id)
upsert_core_person AS (
    INSERT INTO "agape_app_development_demo"."core_person"
        (id, first_name, last_name, birthdate)
    SELECT
        u.id,
        'Miguel',
        'Pineda',
        now()
    FROM upsert_user u
    ON CONFLICT (id)
    DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name  = EXCLUDED.last_name,
        birthdate  = EXCLUDED.birthdate
    RETURNING id
),

-- 3) hr_employee (PK = core_person.id)
upsert_employee AS (
    INSERT INTO "agape_app_development_demo"."hr_employee"
        (id, hire_date, is_active, metadata, avatar_url)
    SELECT
        p.id,
        now(),
        true,
        NULL,
        '/admin.jpg'
    FROM upsert_core_person p
    ON CONFLICT (id)
    DO UPDATE SET
        is_active  = EXCLUDED.is_active,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now()
    RETURNING id
),

-- 4) Rol de seguridad (reemplaza hr_role)
upsert_role AS (
    INSERT INTO "agape_app_development_demo"."security_role"
        (code, name, description, is_system_role, is_active)
    VALUES ('SP', 'Super User', 'Super User', true, true)
    ON CONFLICT (code)
    DO UPDATE SET
        name           = EXCLUDED.name,
        description    = EXCLUDED.description,
        is_system_role = EXCLUDED.is_system_role,
        is_active      = EXCLUDED.is_active,
        updated_at     = now()
    RETURNING id
),

-- 5) Usuario de acceso (security_user)
upsert_security_user AS (
    INSERT INTO "agape_app_development_demo"."security_user"
        (employee_id, username, password_hash, is_active)
    SELECT
        e.id,
        'root',
        'sera_que_esta_contraseña_sirve_señor_hacker?',
        true
    FROM upsert_employee e
    ON CONFLICT (username)
    DO UPDATE SET
        employee_id    = EXCLUDED.employee_id,
        password_hash  = EXCLUDED.password_hash,
        is_active      = EXCLUDED.is_active,
        updated_at     = now()
    RETURNING id
),

-- 6) Asignar rol al usuario de acceso (reemplaza hr_employee_roles)
ins_security_user_role AS (
    INSERT INTO "agape_app_development_demo"."security_user_role"
        (user_id, role_id)
    SELECT su.id, r.id
    FROM upsert_security_user su, upsert_role r
    ON CONFLICT (user_id, role_id) DO NOTHING
    RETURNING user_id, role_id
),

-- 7) Contactos del root (email/phone)
ins_root_email AS (
    INSERT INTO "agape_app_development_demo"."core_contact_method"
        (user_id, contact_type, value, is_primary, label, is_verified, is_active)
    SELECT
        u.id,
        'email',
        'root@agape.com',
        true,
        'principal',
        true,
        true
    FROM upsert_user u
    WHERE NOT EXISTS (
        SELECT 1
        FROM "agape_app_development_demo"."core_contact_method" cm
        WHERE cm.user_id = u.id
          AND cm.contact_type = 'email'
          AND cm.value = 'root@agape.com'
    )
    RETURNING id
),
ins_root_phone AS (
    INSERT INTO "agape_app_development_demo"."core_contact_method"
        (user_id, contact_type, value, is_primary, label, is_verified, is_active)
    SELECT
        u.id,
        'phone',
        '000000000000',
        false,
        'principal',
        false,
        true
    FROM upsert_user u
    WHERE NOT EXISTS (
        SELECT 1
        FROM "agape_app_development_demo"."core_contact_method" cm
        WHERE cm.user_id = u.id
          AND cm.contact_type = 'phone'
          AND cm.value = '000000000000'
    )
    RETURNING id
)

SELECT
    (SELECT id FROM upsert_user)           AS user_id,
    (SELECT id FROM upsert_core_person)    AS core_person_id,
    (SELECT id FROM upsert_employee)       AS employee_id,
    (SELECT id FROM upsert_security_user)  AS access_user_id,
    (SELECT id FROM upsert_role)           AS role_id;

COMMIT;


-- ============================================
-- 3. Sync function (actualizado al nuevo modelo)
-- ============================================
CREATE OR REPLACE FUNCTION "agape_app_development_demo".sync_root_user(
    p_username      text,
    p_password_hash text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    CODE_SUPER_USER_ROLE constant text   := 'SP';
    ADVISORY_LOCK_ID     constant bigint := 123456789111;

    v_lock_acquired      boolean;

    v_access_user_id     integer;
    v_current_username   text;
    v_current_password   text;
BEGIN
    IF p_username IS NULL OR p_password_hash IS NULL THEN
        RAISE NOTICE 'Root user credentials not provided, skipping synchronization.';
        RETURN;
    END IF;

    SELECT pg_try_advisory_lock(ADVISORY_LOCK_ID)
    INTO v_lock_acquired;

    IF NOT v_lock_acquired THEN
        RAISE NOTICE 'Skipped synchronization due to concurrency (lock not acquired).';
        RETURN;
    END IF;

    BEGIN
        RAISE NOTICE 'Starting root user synchronization...';

        -- Buscar el security_user asociado al rol SP
        SELECT su.id,
               su.username,
               su.password_hash
        INTO v_access_user_id,
             v_current_username,
             v_current_password
        FROM "agape_app_development_demo"."security_role" r
        JOIN "agape_app_development_demo"."security_user_role" ur
          ON ur.role_id = r.id
        JOIN "agape_app_development_demo"."security_user" su
          ON su.id = ur.user_id
        WHERE r.code = CODE_SUPER_USER_ROLE
        ORDER BY su.id
        LIMIT 1;

        IF NOT FOUND THEN
            RAISE NOTICE 'Role % not found or no user assigned. Cannot sync root user.', CODE_SUPER_USER_ROLE;
            PERFORM pg_advisory_unlock(ADVISORY_LOCK_ID);
            RETURN;
        END IF;

        IF v_current_username = p_username
           AND v_current_password = p_password_hash THEN
            RAISE NOTICE 'Root user is already synchronized.';
            PERFORM pg_advisory_unlock(ADVISORY_LOCK_ID);
            RETURN;
        END IF;

        UPDATE "agape_app_development_demo"."security_user" su
        SET
            username      = COALESCE(p_username, su.username),
            password_hash = COALESCE(p_password_hash, su.password_hash),
            updated_at    = now()
        WHERE su.id = v_access_user_id
          AND (su.username      IS DISTINCT FROM p_username
           OR su.password_hash IS DISTINCT FROM p_password_hash);

        RAISE NOTICE 'Root user has been successfully synchronized.';
        PERFORM pg_advisory_unlock(ADVISORY_LOCK_ID);

    EXCEPTION
        WHEN OTHERS THEN
            PERFORM pg_advisory_unlock(ADVISORY_LOCK_ID);
            RAISE;
    END;
END;
$$;