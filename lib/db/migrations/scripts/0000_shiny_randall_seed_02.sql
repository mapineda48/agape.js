-- ============================================================
-- Seed 02 (PARTIES) - Demo Papelería
-- Clientes / Proveedores + Contactos + Direcciones
-- ============================================================
-- Notas:
-- - "user" NO guarda email/teléfono/dirección: eso va en core_contact_method y core_user_address.
-- - crm_client y purchasing_supplier heredan del user (PK = user.id).
-- - Este seed es idempotente: puedes ejecutarlo varias veces.
-- ============================================================

BEGIN;

-- ============================================================
-- 0. Asegurar tipos mínimos (por si se corre sin el Seed 00)
-- ============================================================
INSERT INTO "agape_app_development_demo"."core_identity_document_type"
    ("code", "name", "is_enabled", "applies_to_person", "applies_to_company")
VALUES
    ('CC',  'Cédula de ciudadanía',          true, true,  false),
    ('NIT', 'Número de Identificación Tributaria', true, false, true)
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "is_enabled" = EXCLUDED."is_enabled",
    "applies_to_person" = EXCLUDED."applies_to_person",
    "applies_to_company" = EXCLUDED."applies_to_company";

-- Tipos cliente (si no existen)
INSERT INTO "agape_app_development_demo"."crm_client_type" ("name", "is_enabled")
SELECT v.name, v.is_enabled
FROM (VALUES
    ('Regular', true),
    ('VIP', true),
    ('Corporativo', true),
    ('Mayorista', true)
) AS v(name, is_enabled)
WHERE NOT EXISTS (
    SELECT 1 FROM "agape_app_development_demo"."crm_client_type" c WHERE c.name = v.name
);

-- Tipos proveedor (si no existen)
INSERT INTO "agape_app_development_demo"."purchasing_supplier_type" ("name")
SELECT v.name
FROM (VALUES
    ('Papelería y material de oficina'),
    ('Distribuidor de tecnología y cómputo'),
    ('Distribuidor mayorista')
) AS v(name)
WHERE NOT EXISTS (
    SELECT 1 FROM "agape_app_development_demo"."purchasing_supplier_type" s WHERE s.name = v.name
);

-- ============================================================
-- 1) CLIENTES (personas + empresas)
-- ============================================================

-- ------------------------------------------------------------
-- Cliente 01: Juan Pérez (Regular)
-- ------------------------------------------------------------
WITH
doc_cc AS (
  SELECT id FROM "agape_app_development_demo"."core_identity_document_type" WHERE code='CC' LIMIT 1
),
u_src AS (
  SELECT
    'person'::"agape_app_development_demo"."user_type_enum" AS user_type,
    (SELECT id FROM doc_cc) AS document_type_id,
    '1033344556'::varchar(30) AS document_number,
    'CO'::varchar(2) AS country_code,
    'es'::varchar(2) AS language_code,
    'COP'::varchar(3) AS currency_code
),
u_upsert AS (
  INSERT INTO "agape_app_development_demo"."user"
    ("user_type","document_type_id","document_number","country_code","language_code","currency_code","is_active")
  SELECT user_type, document_type_id, document_number, country_code, language_code, currency_code, true
  FROM u_src
  ON CONFLICT ("document_type_id","document_number") DO UPDATE
  SET "updated_at" = now(),
      "is_active"  = true,
      "country_code"  = EXCLUDED."country_code",
      "language_code" = EXCLUDED."language_code",
      "currency_code" = EXCLUDED."currency_code"
  RETURNING id
),
u AS (
  SELECT id FROM u_upsert
  UNION ALL
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN u_src s ON u2.document_type_id=s.document_type_id AND u2.document_number=s.document_number
  LIMIT 1
),
p_upsert AS (
  INSERT INTO "agape_app_development_demo"."core_person" ("id","first_name","last_name","birthdate")
  SELECT id, 'Juan', 'Pérez', '1990-05-10'::timestamptz
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "first_name" = EXCLUDED."first_name",
      "last_name"  = EXCLUDED."last_name",
      "birthdate"  = EXCLUDED."birthdate"
  RETURNING id
),
client_type AS (
  SELECT id FROM "agape_app_development_demo"."crm_client_type" WHERE name='Regular' LIMIT 1
),
c_upsert AS (
  INSERT INTO "agape_app_development_demo"."crm_client" ("id","type_id","photo_url","active")
  SELECT id, (SELECT id FROM client_type), NULL, true
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "type_id"    = EXCLUDED."type_id",
      "photo_url"  = EXCLUDED."photo_url",
      "active"     = true,
      "updated_at" = now()
  RETURNING id
),
addr AS (
  SELECT id FROM "agape_app_development_demo"."core_address" WHERE reference='seed:client:juan:main' LIMIT 1
),
addr_ins AS (
  INSERT INTO "agape_app_development_demo"."core_address"
    ("street","street_line_2","city","state","zip_code","country_code","reference","notes","is_active")
  SELECT
    'Cra 7 # 45-12', NULL, 'Bogotá', 'Cundinamarca', '110311', 'CO',
    'seed:client:juan:main',
    'Dirección demo para cliente Juan Pérez', true
  WHERE NOT EXISTS (SELECT 1 FROM addr)
  RETURNING id
),
addr_id AS (
  SELECT id FROM addr_ins
  UNION ALL
  SELECT id FROM addr
),
ua AS (
  INSERT INTO "agape_app_development_demo"."core_user_address"
    ("user_id","address_id","address_type","is_default","label")
  SELECT u.id, a.id, 'main'::"agape_app_development_demo"."address_type_enum", true, 'Casa'
  FROM u, addr_id a
  ON CONFLICT DO NOTHING
  RETURNING id
)
-- Contactos (email/whatsapp)
INSERT INTO "agape_app_development_demo"."core_contact_method"
  ("user_id","contact_type","value","is_primary","label","is_verified","is_active","notes")
SELECT u.id, x.contact_type, x.value, x.is_primary, x.label, false, true, 'seed'
FROM u
JOIN (
  VALUES
    ('email'::"agape_app_development_demo"."contact_method_type_enum",   'juan.perez@demo.com', true,  'Email'),
    ('whatsapp'::"agape_app_development_demo"."contact_method_type_enum",' +57 300 123 4567',  false, 'WhatsApp'),
    ('phone'::"agape_app_development_demo"."contact_method_type_enum",  '601 555 0101',        false, 'Teléfono')
) AS x(contact_type, value, is_primary, label) ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "agape_app_development_demo"."core_contact_method" cm
  WHERE cm.user_id = u.id AND cm.contact_type = x.contact_type AND cm.value = x.value
);

-- ------------------------------------------------------------
-- Cliente 02: María Gómez (VIP)
-- ------------------------------------------------------------
WITH
doc_cc AS (
  SELECT id FROM "agape_app_development_demo"."core_identity_document_type" WHERE code='CC' LIMIT 1
),
u_src AS (
  SELECT
    'person'::"agape_app_development_demo"."user_type_enum" AS user_type,
    (SELECT id FROM doc_cc) AS document_type_id,
    '1022334455'::varchar(30) AS document_number,
    'CO'::varchar(2) AS country_code,
    'es'::varchar(2) AS language_code,
    'COP'::varchar(3) AS currency_code
),
u_upsert AS (
  INSERT INTO "agape_app_development_demo"."user"
    ("user_type","document_type_id","document_number","country_code","language_code","currency_code","is_active")
  SELECT user_type, document_type_id, document_number, country_code, language_code, currency_code, true
  FROM u_src
  ON CONFLICT ("document_type_id","document_number") DO UPDATE
  SET "updated_at" = now(),
      "is_active"  = true,
      "country_code"  = EXCLUDED."country_code",
      "language_code" = EXCLUDED."language_code",
      "currency_code" = EXCLUDED."currency_code"
  RETURNING id
),
u AS (
  SELECT id FROM u_upsert
  UNION ALL
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN u_src s ON u2.document_type_id=s.document_type_id AND u2.document_number=s.document_number
  LIMIT 1
),
p_upsert AS (
  INSERT INTO "agape_app_development_demo"."core_person" ("id","first_name","last_name","birthdate")
  SELECT id, 'María', 'Gómez', '1994-11-22'::timestamptz
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "first_name" = EXCLUDED."first_name",
      "last_name"  = EXCLUDED."last_name",
      "birthdate"  = EXCLUDED."birthdate"
  RETURNING id
),
client_type AS (
  SELECT id FROM "agape_app_development_demo"."crm_client_type" WHERE name='VIP' LIMIT 1
),
c_upsert AS (
  INSERT INTO "agape_app_development_demo"."crm_client" ("id","type_id","photo_url","active")
  SELECT id, (SELECT id FROM client_type), NULL, true
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "type_id"    = EXCLUDED."type_id",
      "active"     = true,
      "updated_at" = now()
  RETURNING id
),
addr AS (
  SELECT id FROM "agape_app_development_demo"."core_address" WHERE reference='seed:client:maria:main' LIMIT 1
),
addr_ins AS (
  INSERT INTO "agape_app_development_demo"."core_address"
    ("street","street_line_2","city","state","zip_code","country_code","reference","notes","is_active")
  SELECT
    'Cl 72 # 12-34', 'Apto 302', 'Bogotá', 'Cundinamarca', '110221', 'CO',
    'seed:client:maria:main',
    'Dirección demo para cliente María Gómez', true
  WHERE NOT EXISTS (SELECT 1 FROM addr)
  RETURNING id
),
addr_id AS (
  SELECT id FROM addr_ins
  UNION ALL
  SELECT id FROM addr
)
INSERT INTO "agape_app_development_demo"."core_user_address"
  ("user_id","address_id","address_type","is_default","label")
SELECT u.id, a.id, 'main'::"agape_app_development_demo"."address_type_enum", true, 'Apartamento'
FROM u, addr_id a
ON CONFLICT DO NOTHING;

WITH u AS (
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN "agape_app_development_demo"."core_identity_document_type" dt ON dt.id=u2.document_type_id AND dt.code='CC'
  WHERE u2.document_number='1022334455'
  LIMIT 1
)
INSERT INTO "agape_app_development_demo"."core_contact_method"
  ("user_id","contact_type","value","is_primary","label","is_verified","is_active","notes")
SELECT u.id, x.contact_type, x.value, x.is_primary, x.label, false, true, 'seed'
FROM u
JOIN (
  VALUES
    ('email'::"agape_app_development_demo"."contact_method_type_enum",   'maria.gomez@demo.com', true,  'Email'),
    ('mobile'::"agape_app_development_demo"."contact_method_type_enum",  '+57 310 555 7788',     false, 'Celular')
) AS x(contact_type, value, is_primary, label) ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "agape_app_development_demo"."core_contact_method" cm
  WHERE cm.user_id = u.id AND cm.contact_type = x.contact_type AND cm.value = x.value
);

-- ------------------------------------------------------------
-- Cliente 03: Colegio San José (Corporativo) - empresa
-- ------------------------------------------------------------
WITH
doc_nit AS (
  SELECT id FROM "agape_app_development_demo"."core_identity_document_type" WHERE code='NIT' LIMIT 1
),
u_src AS (
  SELECT
    'company'::"agape_app_development_demo"."user_type_enum" AS user_type,
    (SELECT id FROM doc_nit) AS document_type_id,
    '900123456-7'::varchar(30) AS document_number,
    'CO'::varchar(2) AS country_code,
    'es'::varchar(2) AS language_code,
    'COP'::varchar(3) AS currency_code
),
u_upsert AS (
  INSERT INTO "agape_app_development_demo"."user"
    ("user_type","document_type_id","document_number","country_code","language_code","currency_code","is_active")
  SELECT user_type, document_type_id, document_number, country_code, language_code, currency_code, true
  FROM u_src
  ON CONFLICT ("document_type_id","document_number") DO UPDATE
  SET "updated_at" = now(),
      "is_active"  = true,
      "country_code"  = EXCLUDED."country_code",
      "language_code" = EXCLUDED."language_code",
      "currency_code" = EXCLUDED."currency_code"
  RETURNING id
),
u AS (
  SELECT id FROM u_upsert
  UNION ALL
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN u_src s ON u2.document_type_id=s.document_type_id AND u2.document_number=s.document_number
  LIMIT 1
),
co_upsert AS (
  INSERT INTO "agape_app_development_demo"."core_company" ("id","legal_name","trade_name")
  SELECT id, 'Colegio San José S.A.S', 'Colegio San José'
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "legal_name" = EXCLUDED."legal_name",
      "trade_name" = EXCLUDED."trade_name"
  RETURNING id
),
client_type AS (
  SELECT id FROM "agape_app_development_demo"."crm_client_type" WHERE name='Corporativo' LIMIT 1
),
c_upsert AS (
  INSERT INTO "agape_app_development_demo"."crm_client" ("id","type_id","photo_url","active")
  SELECT id, (SELECT id FROM client_type), NULL, true
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "type_id"    = EXCLUDED."type_id",
      "active"     = true,
      "updated_at" = now()
  RETURNING id
),
addr AS (
  SELECT id FROM "agape_app_development_demo"."core_address" WHERE reference='seed:client:colegio:main' LIMIT 1
),
addr_ins AS (
  INSERT INTO "agape_app_development_demo"."core_address"
    ("street","street_line_2","city","state","zip_code","country_code","reference","notes","is_active")
  SELECT
    'Av. 68 # 15-20', NULL, 'Bogotá', 'Cundinamarca', '111311', 'CO',
    'seed:client:colegio:main',
    'Sede principal (demo)', true
  WHERE NOT EXISTS (SELECT 1 FROM addr)
  RETURNING id
),
addr_id AS (
  SELECT id FROM addr_ins
  UNION ALL
  SELECT id FROM addr
)
INSERT INTO "agape_app_development_demo"."core_user_address"
  ("user_id","address_id","address_type","is_default","label")
SELECT u.id, a.id, 'main'::"agape_app_development_demo"."address_type_enum", true, 'Sede principal'
FROM u, addr_id a
ON CONFLICT DO NOTHING;

WITH u AS (
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN "agape_app_development_demo"."core_identity_document_type" dt ON dt.id=u2.document_type_id AND dt.code='NIT'
  WHERE u2.document_number='900123456-7'
  LIMIT 1
)
INSERT INTO "agape_app_development_demo"."core_contact_method"
  ("user_id","contact_type","value","is_primary","label","is_verified","is_active","notes")
SELECT u.id, x.contact_type, x.value, x.is_primary, x.label, false, true, 'seed'
FROM u
JOIN (
  VALUES
    ('email'::"agape_app_development_demo"."contact_method_type_enum", 'compras@colegiosanjose.demo', true, 'Compras'),
    ('phone'::"agape_app_development_demo"."contact_method_type_enum", '601 444 0202', false, 'PBX')
) AS x(contact_type, value, is_primary, label) ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "agape_app_development_demo"."core_contact_method" cm
  WHERE cm.user_id = u.id AND cm.contact_type = x.contact_type AND cm.value = x.value
);

-- ============================================================
-- 2) PROVEEDORES (empresas)
-- ============================================================

-- ------------------------------------------------------------
-- Proveedor 01: Distribuidora Escolar Andina S.A.S (Mayorista)
-- ------------------------------------------------------------
WITH
doc_nit AS (
  SELECT id FROM "agape_app_development_demo"."core_identity_document_type" WHERE code='NIT' LIMIT 1
),
u_src AS (
  SELECT
    'company'::"agape_app_development_demo"."user_type_enum" AS user_type,
    (SELECT id FROM doc_nit) AS document_type_id,
    '901987654-3'::varchar(30) AS document_number,
    'CO'::varchar(2) AS country_code,
    'es'::varchar(2) AS language_code,
    'COP'::varchar(3) AS currency_code
),
u_upsert AS (
  INSERT INTO "agape_app_development_demo"."user"
    ("user_type","document_type_id","document_number","country_code","language_code","currency_code","is_active")
  SELECT user_type, document_type_id, document_number, country_code, language_code, currency_code, true
  FROM u_src
  ON CONFLICT ("document_type_id","document_number") DO UPDATE
  SET "updated_at" = now(),
      "is_active"  = true,
      "country_code"  = EXCLUDED."country_code",
      "language_code" = EXCLUDED."language_code",
      "currency_code" = EXCLUDED."currency_code"
  RETURNING id
),
u AS (
  SELECT id FROM u_upsert
  UNION ALL
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN u_src s ON u2.document_type_id=s.document_type_id AND u2.document_number=s.document_number
  LIMIT 1
),
co_upsert AS (
  INSERT INTO "agape_app_development_demo"."core_company" ("id","legal_name","trade_name")
  SELECT id, 'Distribuidora Escolar Andina S.A.S', 'Andina Mayorista'
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "legal_name" = EXCLUDED."legal_name",
      "trade_name" = EXCLUDED."trade_name"
  RETURNING id
),
sup_type AS (
  SELECT id FROM "agape_app_development_demo"."purchasing_supplier_type" WHERE name='Distribuidor mayorista' LIMIT 1
),
sup_upsert AS (
  INSERT INTO "agape_app_development_demo"."purchasing_supplier" ("id","supplier_type_id","registration_date","active")
  SELECT u.id, (SELECT id FROM sup_type), now(), true
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "supplier_type_id" = EXCLUDED."supplier_type_id",
      "active" = true
  RETURNING id
),
addr AS (
  SELECT id FROM "agape_app_development_demo"."core_address" WHERE reference='seed:supplier:andina:main' LIMIT 1
),
addr_ins AS (
  INSERT INTO "agape_app_development_demo"."core_address"
    ("street","street_line_2","city","state","zip_code","country_code","reference","notes","is_active")
  SELECT
    'Autopista Norte Km 18', 'Bodega 12', 'Bogotá', 'Cundinamarca', '110111', 'CO',
    'seed:supplier:andina:main',
    'Bodega / despacho (demo)', true
  WHERE NOT EXISTS (SELECT 1 FROM addr)
  RETURNING id
),
addr_id AS (
  SELECT id FROM addr_ins
  UNION ALL
  SELECT id FROM addr
)
INSERT INTO "agape_app_development_demo"."core_user_address"
  ("user_id","address_id","address_type","is_default","label")
SELECT u.id, a.id, 'main'::"agape_app_development_demo"."address_type_enum", true, 'Bodega'
FROM u, addr_id a
ON CONFLICT DO NOTHING;

WITH u AS (
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN "agape_app_development_demo"."core_identity_document_type" dt ON dt.id=u2.document_type_id AND dt.code='NIT'
  WHERE u2.document_number='901987654-3'
  LIMIT 1
)
INSERT INTO "agape_app_development_demo"."core_contact_method"
  ("user_id","contact_type","value","is_primary","label","is_verified","is_active","notes")
SELECT u.id, x.contact_type, x.value, x.is_primary, x.label, false, true, 'seed'
FROM u
JOIN (
  VALUES
    ('email'::"agape_app_development_demo"."contact_method_type_enum", 'ventas@andina.demo', true, 'Ventas'),
    ('phone'::"agape_app_development_demo"."contact_method_type_enum", '601 555 0303', false, 'PBX')
) AS x(contact_type, value, is_primary, label) ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "agape_app_development_demo"."core_contact_method" cm
  WHERE cm.user_id = u.id AND cm.contact_type = x.contact_type AND cm.value = x.value
);

-- Crear contacto persona para el proveedor Andina (core_company_contact)
WITH
doc_cc AS (
  SELECT id FROM "agape_app_development_demo"."core_identity_document_type" WHERE code='CC' LIMIT 1
),
contact_user_src AS (
  SELECT
    'person'::"agape_app_development_demo"."user_type_enum" AS user_type,
    (SELECT id FROM doc_cc) AS document_type_id,
    '1122334455'::varchar(30) AS document_number
),
contact_user_upsert AS (
  INSERT INTO "agape_app_development_demo"."user"
    ("user_type","document_type_id","document_number","country_code","language_code","currency_code","is_active")
  SELECT user_type, document_type_id, document_number, 'CO','es','COP', true
  FROM contact_user_src
  ON CONFLICT ("document_type_id","document_number") DO UPDATE
  SET "updated_at"=now(), "is_active"=true
  RETURNING id
),
contact_user AS (
  SELECT id FROM contact_user_upsert
  UNION ALL
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN contact_user_src s ON u2.document_type_id=s.document_type_id AND u2.document_number=s.document_number
  LIMIT 1
),
contact_person AS (
  INSERT INTO "agape_app_development_demo"."core_person" ("id","first_name","last_name","birthdate")
  SELECT id, 'Laura', 'Ramírez', '1988-02-03'::timestamptz
  FROM contact_user
  ON CONFLICT ("id") DO UPDATE
  SET "first_name"=EXCLUDED."first_name", "last_name"=EXCLUDED."last_name", "birthdate"=EXCLUDED."birthdate"
  RETURNING id
),
company AS (
  SELECT u3.id AS company_id
  FROM "agape_app_development_demo"."user" u3
  JOIN "agape_app_development_demo"."core_identity_document_type" dt ON dt.id=u3.document_type_id AND dt.code='NIT'
  WHERE u3.document_number='901987654-3'
  LIMIT 1
)
INSERT INTO "agape_app_development_demo"."core_company_contact"
  ("company_id","person_id","role","department","is_primary","is_active","notes")
SELECT company.company_id, contact_user.id, 'Ejecutiva de ventas', 'Ventas', true, true, 'seed'
FROM company, contact_user
WHERE NOT EXISTS (
  SELECT 1
  FROM "agape_app_development_demo"."core_company_contact" cc
  WHERE cc.company_id = company.company_id AND cc.person_id = contact_user.id
);

-- ------------------------------------------------------------
-- Proveedor 02: TechPrint Colombia S.A.S (Tecnología y Cómputo)
-- ------------------------------------------------------------
WITH
doc_nit AS (
  SELECT id FROM "agape_app_development_demo"."core_identity_document_type" WHERE code='NIT' LIMIT 1
),
u_src AS (
  SELECT
    'company'::"agape_app_development_demo"."user_type_enum" AS user_type,
    (SELECT id FROM doc_nit) AS document_type_id,
    '900777888-1'::varchar(30) AS document_number,
    'CO'::varchar(2) AS country_code,
    'es'::varchar(2) AS language_code,
    'COP'::varchar(3) AS currency_code
),
u_upsert AS (
  INSERT INTO "agape_app_development_demo"."user"
    ("user_type","document_type_id","document_number","country_code","language_code","currency_code","is_active")
  SELECT user_type, document_type_id, document_number, country_code, language_code, currency_code, true
  FROM u_src
  ON CONFLICT ("document_type_id","document_number") DO UPDATE
  SET "updated_at" = now(),
      "is_active"  = true
  RETURNING id
),
u AS (
  SELECT id FROM u_upsert
  UNION ALL
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN u_src s ON u2.document_type_id=s.document_type_id AND u2.document_number=s.document_number
  LIMIT 1
),
co_upsert AS (
  INSERT INTO "agape_app_development_demo"."core_company" ("id","legal_name","trade_name")
  SELECT id, 'TechPrint Colombia S.A.S', 'TechPrint'
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "legal_name" = EXCLUDED."legal_name",
      "trade_name" = EXCLUDED."trade_name"
  RETURNING id
),
sup_type AS (
  SELECT id FROM "agape_app_development_demo"."purchasing_supplier_type" WHERE name='Distribuidor de tecnología y cómputo' LIMIT 1
),
sup_upsert AS (
  INSERT INTO "agape_app_development_demo"."purchasing_supplier" ("id","supplier_type_id","registration_date","active")
  SELECT u.id, (SELECT id FROM sup_type), now(), true
  FROM u
  ON CONFLICT ("id") DO UPDATE
  SET "supplier_type_id" = EXCLUDED."supplier_type_id",
      "active" = true
  RETURNING id
)
SELECT 1;

WITH u AS (
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN "agape_app_development_demo"."core_identity_document_type" dt ON dt.id=u2.document_type_id AND dt.code='NIT'
  WHERE u2.document_number='900777888-1'
  LIMIT 1
),
addr AS (
  SELECT id FROM "agape_app_development_demo"."core_address" WHERE reference='seed:supplier:techprint:main' LIMIT 1
),
addr_ins AS (
  INSERT INTO "agape_app_development_demo"."core_address"
    ("street","street_line_2","city","state","zip_code","country_code","reference","notes","is_active")
  SELECT
    'Cra 30 # 10-55', NULL, 'Bogotá', 'Cundinamarca', '111711', 'CO',
    'seed:supplier:techprint:main',
    'Oficina comercial (demo)', true
  WHERE NOT EXISTS (SELECT 1 FROM addr)
  RETURNING id
),
addr_id AS (
  SELECT id FROM addr_ins
  UNION ALL
  SELECT id FROM addr
)
INSERT INTO "agape_app_development_demo"."core_user_address"
  ("user_id","address_id","address_type","is_default","label")
SELECT u.id, a.id, 'main'::"agape_app_development_demo"."address_type_enum", true, 'Oficina'
FROM u, addr_id a
ON CONFLICT DO NOTHING;

WITH u AS (
  SELECT u2.id
  FROM "agape_app_development_demo"."user" u2
  JOIN "agape_app_development_demo"."core_identity_document_type" dt ON dt.id=u2.document_type_id AND dt.code='NIT'
  WHERE u2.document_number='900777888-1'
  LIMIT 1
)
INSERT INTO "agape_app_development_demo"."core_contact_method"
  ("user_id","contact_type","value","is_primary","label","is_verified","is_active","notes")
SELECT u.id, x.contact_type, x.value, x.is_primary, x.label, false, true, 'seed'
FROM u
JOIN (
  VALUES
    ('email'::"agape_app_development_demo"."contact_method_type_enum", 'comercial@techprint.demo', true, 'Comercial'),
    ('phone'::"agape_app_development_demo"."contact_method_type_enum", '601 555 0404', false, 'PBX')
) AS x(contact_type, value, is_primary, label) ON true
WHERE NOT EXISTS (
  SELECT 1
  FROM "agape_app_development_demo"."core_contact_method" cm
  WHERE cm.user_id = u.id AND cm.contact_type = x.contact_type AND cm.value = x.value
);

COMMIT;