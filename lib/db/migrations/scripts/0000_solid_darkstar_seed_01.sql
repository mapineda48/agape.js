CREATE OR REPLACE FUNCTION "agape_app_development_demo".sync_root_user(
    p_username      text,
    p_password_hash text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    -- Constantes equivalentes a las de Node
    CODE_SUPER_USER_ROLE constant text   := 'SP';
    ADVISORY_LOCK_ID     constant bigint := 123456789111;

    v_lock_acquired      boolean;

    v_access_user_id     integer;
    v_current_username   text;
    v_current_password   text;
BEGIN
    -- Validación básica: si no hay credenciales, no hacemos nada
    IF p_username IS NULL OR p_password_hash IS NULL THEN
        RAISE NOTICE 'Root user credentials not provided, skipping synchronization.';
        RETURN;
    END IF;

    -- Intento de lock no bloqueante
    SELECT pg_try_advisory_lock(ADVISORY_LOCK_ID)
    INTO v_lock_acquired;

    IF NOT v_lock_acquired THEN
        RAISE NOTICE 'Skipped synchronization due to concurrency (lock not acquired).';
        RETURN;
    END IF;

    -- Bloque protegido para garantizar el unlock
    BEGIN
        RAISE NOTICE 'Starting root user synchronization...';

        -- Buscar el usuario de acceso asociado al rol SP
        SELECT su.id,
               su.username,
               su.password_hash
        INTO v_access_user_id,
             v_current_username,
             v_current_password
        FROM "agape_app_development_demo"."hr_role" r
        JOIN "agape_app_development_demo"."hr_employee_roles" er
          ON er.role_id = r.id
        JOIN "agape_app_development_demo"."hr_employee" e
          ON e.id = er.employee_id
        JOIN "agape_app_development_demo"."security_user" su
          ON su.employee_id = e.id
        WHERE r.code = CODE_SUPER_USER_ROLE
        ORDER BY su.id
        LIMIT 1;

        IF NOT FOUND THEN
            RAISE NOTICE 'Role % not found or no user assigned. Cannot sync root user.', CODE_SUPER_USER_ROLE;
            -- Liberamos el lock antes de salir
            PERFORM pg_advisory_unlock(ADVISORY_LOCK_ID);
            RETURN;
        END IF;

        -- Si username y password_hash son iguales, no hacemos nada
        IF v_current_username = p_username
           AND v_current_password = p_password_hash THEN
            RAISE NOTICE 'Root user is already synchronized.';
            PERFORM pg_advisory_unlock(ADVISORY_LOCK_ID);
            RETURN;
        END IF;

        -- Solo actualizamos si algo cambió
        UPDATE "agape_app_development_demo"."security_user" su
        SET
            username      = COALESCE(p_username, su.username),
            password_hash = COALESCE(p_password_hash, su.password_hash)
        WHERE su.id = v_access_user_id
          AND (su.username      IS DISTINCT FROM p_username
           OR su.password_hash IS DISTINCT FROM p_password_hash);

        RAISE NOTICE 'Root user has been successfully synchronized.';

        -- Liberar lock en caso de éxito
        PERFORM pg_advisory_unlock(ADVISORY_LOCK_ID);

    EXCEPTION
        WHEN OTHERS THEN
            -- Asegurar unlock también en error
            PERFORM pg_advisory_unlock(ADVISORY_LOCK_ID);
            RAISE;
    END;
END;
$$;