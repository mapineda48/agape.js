-- ============================================================
-- Seed 00 (CONFIG) - Demo Papelería
-- Solo datos de configuración / maestros del sistema
-- ============================================================

BEGIN;

-- ============================================================
-- 0. Configuración del Sistema (tabla agape - key/value)
--    Papelería Agape - Colombia
-- ============================================================
INSERT INTO "agape_app_development_demo"."agape" ("key", "value")
VALUES
    -- Información de la empresa
    ('system.companyName', '"Papelería Agape"'),
    ('system.companyNit', '"900555444-3"'),
    ('system.companyAddress', '"Cra 15 # 82-34, Bogotá, Cundinamarca, Colombia"'),
    ('system.companyPhone', '"+57 601 555 1234"'),
    ('system.companyEmail', '"contacto@papeleriaagape.co"'),
    ('system.companyLogo', '""'),
    
    -- Configuración regional
    ('system.country', '"CO"'),
    ('system.language', '"es"'),
    ('system.timezone', '"America/Bogota"'),
    ('system.currency', '"COP"'),
    ('system.decimalPlaces', '2')
ON CONFLICT ("key") DO UPDATE
SET "value" = EXCLUDED."value",
    "updated_at" = now();

-- ============================================================
-- 0.1 Departamentos HR (hr_department)
-- ============================================================
INSERT INTO "agape_app_development_demo"."hr_department"
    ("code", "name", "description", "parent_id", "cost_center_code", "manager_id", "is_active")
VALUES
    ('ADMIN', 'Administración', 'Gerencia y administración general', NULL, 'CC-ADMIN', NULL, true),
    ('VENTAS', 'Ventas', 'Departamento de ventas y atención al cliente', NULL, 'CC-VENTAS', NULL, true),
    ('BODEGA', 'Bodega', 'Almacén e inventario', NULL, 'CC-BODEGA', NULL, true),
    ('CONTA', 'Contabilidad', 'Departamento de contabilidad y finanzas', NULL, 'CC-CONTA', NULL, true),
    ('COMPRAS', 'Compras', 'Gestión de compras y proveedores', NULL, 'CC-COMPRAS', NULL, true)
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "cost_center_code" = EXCLUDED."cost_center_code",
    "is_active" = EXCLUDED."is_active";

-- ============================================================
-- 0.2 Puestos de Trabajo (hr_job_position)
-- ============================================================
INSERT INTO "agape_app_development_demo"."hr_job_position"
    ("code", "name", "description", "is_active")
VALUES
    ('GER', 'Gerente', 'Gerente general de la papelería', true),
    ('ADMIN-AUX', 'Auxiliar Administrativo', 'Apoyo en tareas administrativas', true),
    ('VEND', 'Vendedor', 'Vendedor de mostrador', true),
    ('VEND-SR', 'Vendedor Senior', 'Vendedor con experiencia y mayores responsabilidades', true),
    ('BOD-JEFE', 'Jefe de Bodega', 'Responsable del área de bodega e inventario', true),
    ('BOD-AUX', 'Auxiliar de Bodega', 'Apoyo en bodega e inventario', true),
    ('CONT', 'Contador', 'Contador público titulado', true),
    ('CONT-AUX', 'Auxiliar Contable', 'Apoyo en tareas contables', true),
    ('COMP-JEFE', 'Jefe de Compras', 'Responsable de compras y relación con proveedores', true),
    ('CAJ', 'Cajero', 'Encargado de caja y cobros', true)
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "is_active" = EXCLUDED."is_active";

-- ============================================================
-- 0.3 Roles de Seguridad (security_role)
-- ============================================================
INSERT INTO "agape_app_development_demo"."security_role"
    ("code", "name", "description", "is_system_role", "is_active")
VALUES
    ('ADMIN', 'Administrador', 'Acceso completo al sistema', true, true),
    ('GERENTE', 'Gerente', 'Acceso a reportes y configuración', false, true),
    ('VENDEDOR', 'Vendedor', 'Acceso a ventas, clientes e inventario (solo lectura)', false, true),
    ('BODEGUERO', 'Bodeguero', 'Acceso a inventario y movimientos', false, true),
    ('CONTADOR', 'Contador', 'Acceso a finanzas, reportes y configuración contable', false, true),
    ('CAJERO', 'Cajero', 'Acceso a punto de venta y cobros', false, true),
    ('COMPRADOR', 'Comprador', 'Acceso a compras, proveedores y recepción de mercancía', false, true)
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "is_system_role" = EXCLUDED."is_system_role",
    "is_active" = EXCLUDED."is_active";

-- ============================================================
-- 0.4 Tipos de documento (identidad) - por seguridad (root ya lo hace)
-- ============================================================
INSERT INTO "agape_app_development_demo"."core_identity_document_type"
    ("code", "name", "is_enabled", "applies_to_person", "applies_to_company")
VALUES
    ('CC',  'Cédula de ciudadanía',          true, true,  false),
    ('NIT', 'Número de Identificación Tributaria', true, false, true),
    ('CE',  'Cédula de extranjería',         true, true,  false),
    ('TI',  'Tarjeta de identidad',          true, true,  false),
    ('PA',  'Pasaporte',                     true, true,  false),
    ('RC',  'Registro civil',                true, true,  false)
ON CONFLICT ("code") DO UPDATE
SET "name" = EXCLUDED."name",
    "is_enabled" = EXCLUDED."is_enabled",
    "applies_to_person" = EXCLUDED."applies_to_person",
    "applies_to_company" = EXCLUDED."applies_to_company";

-- ============================================================
-- 1. Monedas (finance_currency)
-- ============================================================
INSERT INTO "agape_app_development_demo"."finance_currency"
    ("code", "full_name", "symbol", "exchange_rate", "is_base", "is_enabled")
VALUES
    ('COP', 'Peso colombiano', '$', 1,    true,  true),
    ('USD', 'Dólar estadounidense', '$', 4000, false, true)
ON CONFLICT ("code") DO UPDATE
SET "full_name"     = EXCLUDED."full_name",
    "symbol"        = EXCLUDED."symbol",
    "exchange_rate" = EXCLUDED."exchange_rate",
    "is_base"       = EXCLUDED."is_base",
    "is_enabled"    = EXCLUDED."is_enabled";

-- ============================================================
-- 2. Listas de precios (catalogs_price_list)
-- ============================================================
INSERT INTO "agape_app_development_demo"."catalogs_price_list"
    ("code", "full_name", "description", "is_default", "is_enabled")
VALUES
    ('GEN', 'General',   'Precio estándar al público', true,  true),
    ('MAY', 'Mayorista', 'Precio para compras al por mayor', false, true),
    ('VIP', 'VIP',       'Precio preferencial para clientes VIP', false, true)
ON CONFLICT ("code") DO UPDATE
SET "full_name"    = EXCLUDED."full_name",
    "description"  = EXCLUDED."description",
    "is_default"   = EXCLUDED."is_default",
    "is_enabled"   = EXCLUDED."is_enabled";

-- Garantizar un único default (por si se ejecuta varias veces)
UPDATE "agape_app_development_demo"."catalogs_price_list"
SET "is_default" = (code = 'GEN')
WHERE code IN ('GEN', 'MAY', 'VIP');

-- ============================================================
-- 3. Términos de pago (finance_payment_terms)
-- ============================================================
INSERT INTO "agape_app_development_demo"."finance_payment_terms"
    ("code", "full_name", "description", "due_days", "is_default", "is_enabled")
VALUES
    ('CONTADO', 'Contado',      'Pago inmediato', 0,  true,  true),
    ('15D',     'Crédito 15 días', 'Pago a 15 días', 15, false, true),
    ('30D',     'Crédito 30 días', 'Pago a 30 días', 30, false, true)
ON CONFLICT ("code") DO UPDATE
SET "full_name"  = EXCLUDED."full_name",
    "description"= EXCLUDED."description",
    "due_days"   = EXCLUDED."due_days",
    "is_default" = EXCLUDED."is_default",
    "is_enabled" = EXCLUDED."is_enabled";

UPDATE "agape_app_development_demo"."finance_payment_terms"
SET "is_default" = (code = 'CONTADO')
WHERE code IN ('CONTADO', '15D', '30D');

-- ============================================================
-- 4. Métodos de pago (finance_payment_method)
-- ============================================================
INSERT INTO "agape_app_development_demo"."finance_payment_method"
    ("code", "full_name", "description",
     "requires_reference", "requires_bank_account", "is_enabled")
VALUES
    ('EFECTIVO',   'Efectivo',     'Pago en efectivo', false, false, true),
    ('TARJETA',     'Tarjeta',      'Débito / crédito', true,  false, true),
    ('TRANSFER',    'Transferencia', 'Transferencia bancaria', true,  true,  true),
    ('NEQUI',       'Nequi',        'Pago por Nequi',  true,  false, true),
    ('DAVIPLATA',   'Daviplata',    'Pago por Daviplata', true, false, true)
ON CONFLICT ("code") DO UPDATE
SET "full_name"            = EXCLUDED."full_name",
    "description"          = EXCLUDED."description",
    "requires_reference"   = EXCLUDED."requires_reference",
    "requires_bank_account"= EXCLUDED."requires_bank_account",
    "is_enabled"           = EXCLUDED."is_enabled";

-- ============================================================
-- 5. Impuestos (finance_tax) y grupos (finance_tax_group)
-- ============================================================
INSERT INTO "agape_app_development_demo"."finance_tax"
    ("code", "full_name", "description", "rate", "is_enabled")
VALUES
    ('IVA_0',  'IVA 0%',  'Exento / 0%', 0.00,  true),
    ('IVA_5',  'IVA 5%',  'IVA reducido', 5.00,  true),
    ('IVA_19', 'IVA 19%', 'IVA general', 19.00, true)
ON CONFLICT ("code") DO UPDATE
SET "full_name"   = EXCLUDED."full_name",
    "description" = EXCLUDED."description",
    "rate"        = EXCLUDED."rate",
    "is_enabled"  = EXCLUDED."is_enabled";

INSERT INTO "agape_app_development_demo"."finance_tax_group"
    ("code", "full_name", "description", "is_enabled")
VALUES
    ('EXENTO', 'Exento', 'Grupo sin impuestos', true),
    ('GRAVA_5', 'Gravado 5%', 'Grupo con IVA 5%', true),
    ('GRAVA_19', 'Gravado 19%', 'Grupo con IVA 19%', true)
ON CONFLICT ("code") DO UPDATE
SET "full_name"   = EXCLUDED."full_name",
    "description" = EXCLUDED."description",
    "is_enabled"  = EXCLUDED."is_enabled";

-- Relaciones grupo-impuesto (tabla puente con PK compuesta)
WITH tax_ids AS (
    SELECT id, code FROM "agape_app_development_demo"."finance_tax" WHERE code IN ('IVA_0','IVA_5','IVA_19')
),
grp_ids AS (
    SELECT id, code FROM "agape_app_development_demo"."finance_tax_group" WHERE code IN ('EXENTO','GRAVA_5','GRAVA_19')
)
INSERT INTO "agape_app_development_demo"."finance_tax_group_tax" ("tax_group_id", "tax_id")
SELECT g.id, t.id
FROM grp_ids g
JOIN tax_ids t ON (
    (g.code = 'EXENTO'   AND t.code = 'IVA_0') OR
    (g.code = 'GRAVA_5'  AND t.code = 'IVA_5') OR
    (g.code = 'GRAVA_19' AND t.code = 'IVA_19')
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. Grupos contables de ítems (finance_item_accounting_group)
-- ============================================================
INSERT INTO "agape_app_development_demo"."finance_item_accounting_group"
    ("code", "full_name", "description",
     "account_inventory", "account_cost_of_goods_sold", "account_sales_revenue", "account_purchases",
     "is_enabled")
VALUES
    ('MER', 'Mercancía', 'Artículos físicos (papelería) que manejan inventario',
        '1435', '6135', '4135', '1435', true),
    ('SER', 'Servicios', 'Servicios (impresión, fotocopias, encuadernación)',
        NULL, NULL, '4140', NULL, true)
ON CONFLICT ("code") DO UPDATE
SET "full_name"                 = EXCLUDED."full_name",
    "description"               = EXCLUDED."description",
    "account_inventory"         = EXCLUDED."account_inventory",
    "account_cost_of_goods_sold"= EXCLUDED."account_cost_of_goods_sold",
    "account_sales_revenue"     = EXCLUDED."account_sales_revenue",
    "account_purchases"         = EXCLUDED."account_purchases",
    "is_enabled"                = EXCLUDED."is_enabled";

-- ============================================================
-- 7. Unidades de medida (inventory_unit_of_measure)
-- ============================================================
INSERT INTO "agape_app_development_demo"."inventory_unit_of_measure"
    ("code", "full_name", "description", "is_enabled")
VALUES
    ('UND', 'Unidad', 'Unidad individual', true),
    ('PAQ', 'Paquete', 'Paquete / set', true),
    ('CAJ', 'Caja', 'Caja', true),
    ('RES', 'Resma', 'Resma (papel)', true),
    ('ROL', 'Rollo', 'Rollo (cinta, papel, vinilo)', true),
    ('MET', 'Metro', 'Medida en metros', true)
ON CONFLICT ("code") DO UPDATE
SET "full_name"   = EXCLUDED."full_name",
    "description" = EXCLUDED."description",
    "is_enabled"  = EXCLUDED."is_enabled";

-- ============================================================
-- 8. Ubicaciones de inventario (inventory_location)
--    (actualizado al nuevo esquema: code/type obligatorios)
-- ============================================================
INSERT INTO "agape_app_development_demo"."inventory_location"
    ("name", "code", "type", "description", "is_enabled")
VALUES
    ('Bodega Principal', 'WH-PRIN', 'WAREHOUSE', 'Bodega principal de la papelería', true),
    ('Mostrador',        'STO-MOST', 'STORE',    'Área de venta / vitrina', true),
    ('Bodega Secundaria','WH-SEC',  'WAREHOUSE', 'Bodega auxiliar', true)
ON CONFLICT ("code") DO UPDATE
SET "name"        = EXCLUDED."name",
    "type"        = EXCLUDED."type",
    "description" = EXCLUDED."description",
    "is_enabled"  = EXCLUDED."is_enabled";

-- ============================================================
-- 9. Tipos (config) de CRM y Proveedores
--    (sin unique -> insert si no existe)
-- ============================================================
INSERT INTO "agape_app_development_demo"."crm_client_type" ("name", "is_enabled")
SELECT v.name, v.is_enabled
FROM (VALUES
    ('Regular', true),
    ('VIP', true),
    ('Ocasional', true),
    ('Corporativo', true),
    ('Distribuidor', true),
    ('Mayorista', true),
    ('Minorista', true),
    ('Prospecto', true)
) AS v(name, is_enabled)
WHERE NOT EXISTS (
    SELECT 1 FROM "agape_app_development_demo"."crm_client_type" c WHERE c.name = v.name
);

INSERT INTO "agape_app_development_demo"."purchasing_supplier_type" ("name")
SELECT v.name
FROM (VALUES
    ('Papelería y material de oficina'),
    ('Proveedor de artículos escolares'),
    ('Distribuidor de tecnología y cómputo'),
    ('Impresión y copiado'),
    ('Proveedor de mobiliario'),
    ('Suministros de arte y manualidades'),
    ('Servicios de mensajería y paquetería'),
    ('Distribuidor mayorista'),
    ('Proveedor de limpieza'),
    ('Servicios generales')
) AS v(name)
WHERE NOT EXISTS (
    SELECT 1 FROM "agape_app_development_demo"."purchasing_supplier_type" s WHERE s.name = v.name
);

-- ============================================================
-- 10. Numeración: tipos de documento (numbering_document_type)
-- ============================================================
INSERT INTO "agape_app_development_demo"."numbering_document_type"
    ("code", "name", "description", "module", "is_enabled")
VALUES
    ('INV_MOV', 'Movimiento de Inventario', 'Documentos de movimientos de inventario', 'inventory', true),
    ('SAL_INV', 'Factura de Venta',         'Facturación de ventas',                   'finance',   true),
    ('PUR_INV', 'Factura de Compra',        'Facturación de compras',                  'finance',   true)
ON CONFLICT ("code") DO UPDATE
SET "name"        = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "module"      = EXCLUDED."module",
    "is_enabled"  = EXCLUDED."is_enabled";

-- ============================================================
-- 11. Numeración: series (numbering_document_series)
--     (sin unique -> insert si no existe)
-- ============================================================
WITH doc_types AS (
    SELECT id, code FROM "agape_app_development_demo"."numbering_document_type"
    WHERE code IN ('INV_MOV','SAL_INV','PUR_INV')
),
series_values AS (
    SELECT * FROM (VALUES
        -- INV_MOV
        ('INV_MOV','ENTRADA','E-',NULL, 1::bigint, 999999::bigint, true),
        ('INV_MOV','SALIDA','S-',NULL, 1::bigint, 999999::bigint, false),
        ('INV_MOV','AJUSTE','A-',NULL, 1::bigint, 999999::bigint, false),
        ('INV_MOV','TRANSFER','T-',NULL, 1::bigint, 999999::bigint, false),

        -- SAL_INV
        ('SAL_INV','POS','POS-',NULL, 1::bigint, 999999::bigint, true),
        ('SAL_INV','FAC','FAC-',NULL, 1::bigint, 999999::bigint, false),

        -- PUR_INV
        ('PUR_INV','COMPRA','C-',NULL, 1::bigint, 999999::bigint, true)
    ) AS v(doc_type_code, series_code, prefix, suffix, start_number, end_number, is_default)
)
INSERT INTO "agape_app_development_demo"."numbering_document_series"
    ("document_type_id","series_code","prefix","suffix","start_number","end_number","current_number",
     "valid_from","valid_to","is_active","is_default")
SELECT
    dt.id,
    sv.series_code,
    sv.prefix,
    sv.suffix,
    sv.start_number,
    sv.end_number,
    sv.start_number,
    NOW() - INTERVAL '1 month',
    NULL,
    true,
    sv.is_default
FROM series_values sv
JOIN doc_types dt ON dt.code = sv.doc_type_code
WHERE NOT EXISTS (
    SELECT 1
    FROM "agape_app_development_demo"."numbering_document_series" ds
    WHERE ds.document_type_id = dt.id
      AND ds.series_code = sv.series_code
);

-- ============================================================
-- 12. Tipos de movimiento de inventario (inventory_movement_type)
--     (sin unique -> insert si no existe)
-- ============================================================
WITH inv_doc_type AS (
    SELECT id FROM "agape_app_development_demo"."numbering_document_type" WHERE code = 'INV_MOV'
),
vals AS (
    SELECT * FROM (VALUES
        ('Entrada',  1::smallint,  true, true),
        ('Salida',  -1::smallint, true, true),
        ('Transferencia', 1::smallint, true, true),
        ('Ajuste de Entrada', 1::smallint, true, true),
        ('Ajuste de Salida', -1::smallint, true, true),
        ('Venta', -1::smallint, true, true),
        ('Compra', 1::smallint, true, true)
    ) AS v(name, factor, affects_stock, is_enabled)
)
INSERT INTO "agape_app_development_demo"."inventory_movement_type"
    ("name","factor","affects_stock","is_enabled","document_type_id")
SELECT v.name, v.factor, v.affects_stock, v.is_enabled, dt.id
FROM inv_doc_type dt
JOIN vals v ON true
WHERE NOT EXISTS (
    SELECT 1
    FROM "agape_app_development_demo"."inventory_movement_type" mt
    WHERE mt.name = v.name AND mt.document_type_id = dt.id
);

-- ============================================================
-- 13. Catálogo: categorías y subcategorías (papelería)
--     (sin unique -> insert si no existe)
-- ============================================================
INSERT INTO "agape_app_development_demo"."catalogs_categories" ("full_name", "is_enabled")
SELECT v.full_name, v.is_enabled
FROM (VALUES
    ('Escritura', true),
    ('Papel', true),
    ('Cuadernos', true),
    ('Oficina', true),
    ('Arte', true),
    ('Tecnología', true),
    ('Escolar', true)
) AS v(full_name, is_enabled)
WHERE NOT EXISTS (
    SELECT 1 FROM "agape_app_development_demo"."catalogs_categories" c WHERE c.full_name = v.full_name
);

WITH cat AS (
    SELECT id, full_name FROM "agape_app_development_demo"."catalogs_categories"
),
subs AS (
    SELECT * FROM (VALUES
        -- Escritura
        ('Bolígrafos', 'Escritura'),
        ('Lápices', 'Escritura'),
        ('Marcadores', 'Escritura'),
        ('Resaltadores', 'Escritura'),
        ('Correctores', 'Escritura'),

        -- Papel
        ('Bond', 'Papel'),
        ('Cartulina', 'Papel'),
        ('Opalina', 'Papel'),
        ('Fotográfico', 'Papel'),
        ('Periódico', 'Papel'),

        -- Cuadernos
        ('Argollados', 'Cuadernos'),
        ('Cosidos', 'Cuadernos'),
        ('Libretas', 'Cuadernos'),
        ('Agendas', 'Cuadernos'),

        -- Oficina
        ('Archivadores', 'Oficina'),
        ('Grapadoras', 'Oficina'),
        ('Perforadoras', 'Oficina'),
        ('Clips y Sujetadores', 'Oficina'),
        ('Cintas Adhesivas', 'Oficina'),

        -- Arte
        ('Pinturas', 'Arte'),
        ('Pinceles', 'Arte'),
        ('Lienzos', 'Arte'),
        ('Arcilla', 'Arte'),
        ('Crayones', 'Arte'),

        -- Tecnología
        ('Calculadoras', 'Tecnología'),
        ('Memorias USB', 'Tecnología'),
        ('Mouse y teclados', 'Tecnología'),
        ('Audífonos', 'Tecnología'),

        -- Escolar
        ('Morrales', 'Escolar'),
        ('Loncheras', 'Escolar'),
        ('Cartucheras', 'Escolar'),
        ('Reglas y geometría', 'Escolar')
    ) AS v(full_name, category_full_name)
)
INSERT INTO "agape_app_development_demo"."catalogs_subcategories" ("full_name", "is_enabled", "category_id")
SELECT s.full_name, true, c.id
FROM subs s
JOIN cat c ON c.full_name = s.category_full_name
WHERE NOT EXISTS (
    SELECT 1
    FROM "agape_app_development_demo"."catalogs_subcategories" sc
    WHERE sc.category_id = c.id
      AND sc.full_name = s.full_name
);

-- ============================================================
-- 14. Atributos de ítems (catalogs_item_attribute) y valores (catalogs_item_attribute_value)
-- ============================================================
INSERT INTO "agape_app_development_demo"."catalogs_item_attribute"
    ("code", "full_name", "description", "is_enabled")
VALUES
    ('MARCA',   'Marca',   'Marca comercial del producto', true),
    ('COLOR',   'Color',   'Color del producto', true),
    ('TAM',     'Tamaño',  'Tamaño / formato', true),
    ('GRAM',    'Gramaje', 'Gramaje del papel (g/m²)', true),
    ('PUNTA',   'Punta',   'Tipo / grosor de punta', true),
    ('PRES',    'Presentación', 'Presentación / empaque', true)
ON CONFLICT ("code") DO UPDATE
SET "full_name"   = EXCLUDED."full_name",
    "description" = EXCLUDED."description",
    "is_enabled"  = EXCLUDED."is_enabled";

-- Valores por atributo (idempotente por (attribute_id, code))
WITH attrs AS (
    SELECT id, code FROM "agape_app_development_demo"."catalogs_item_attribute"
    WHERE code IN ('MARCA','COLOR','TAM','GRAM','PUNTA','PRES')
),
vals AS (
    SELECT * FROM (VALUES
        -- MARCA
        ('MARCA','NORMA','Norma','Norma', 10),
        ('MARCA','FABER','Faber-Castell','Faber-Castell', 20),
        ('MARCA','PELIK','Pelikan','Pelikan', 30),
        ('MARCA','BIC','BIC','BIC', 40),

        -- COLOR
        ('COLOR','NEGRO','Negro','Negro', 10),
        ('COLOR','AZUL','Azul','Azul', 20),
        ('COLOR','ROJO','Rojo','Rojo', 30),
        ('COLOR','VERDE','Verde','Verde', 40),
        ('COLOR','MULTI','Multicolor','Multicolor', 50),

        -- TAM
        ('TAM','A4','A4','A4', 10),
        ('TAM','CARTA','Carta','Carta', 20),
        ('TAM','OFICIO','Oficio','Oficio', 30),

        -- GRAM
        ('GRAM','75','75 g/m²','75', 10),
        ('GRAM','90','90 g/m²','90', 20),
        ('GRAM','120','120 g/m²','120', 30),

        -- PUNTA
        ('PUNTA','0_5','0.5 mm','0.5', 10),
        ('PUNTA','0_7','0.7 mm','0.7', 20),
        ('PUNTA','1_0','1.0 mm','1.0', 30),

        -- PRES
        ('PRES','UND','Unidad','UND', 10),
        ('PRES','PAQ','Paquete','PAQ', 20),
        ('PRES','CAJ','Caja','CAJ', 30),
        ('PRES','RES','Resma','RES', 40)
    ) AS v(attr_code, code, full_name, display_value, sort_order)
)
INSERT INTO "agape_app_development_demo"."catalogs_item_attribute_value"
    ("attribute_id","code","full_name","display_value","sort_order","is_enabled")
SELECT a.id, v.code, v.full_name, v.display_value, v.sort_order, true
FROM vals v
JOIN attrs a ON a.code = v.attr_code
ON CONFLICT ("attribute_id","code") DO UPDATE
SET "full_name"     = EXCLUDED."full_name",
    "display_value" = EXCLUDED."display_value",
    "sort_order"    = EXCLUDED."sort_order",
    "is_enabled"    = EXCLUDED."is_enabled";

COMMIT;


-- ============================================================
-- SEED 01 - INVENTARIO (Papelería demo)
-- Requiere que ya se haya ejecutado:
--   - root seed (usuario root / empleado root)
--   - seed de CONFIGURACIÓN (categorías, subcategorías, UOM, taxes, series, movement types, locations, etc.)
-- ============================================================

-- Nota:
-- Este seed es idempotente: usa ON CONFLICT/WHERE NOT EXISTS y “documentos” fijos (serie + número)
-- para que puedas re-ejecutarlo sin duplicar.

-- ============================================================
-- 1) Ítems (solo GOODS) para inventario - temática Papelería
--    Inserta / actualiza catalogs_item con:
--      - tax_group_id
--      - item_accounting_group_id
--      - images (jsonb NOT NULL)
-- ============================================================
WITH cat AS (
    SELECT id, full_name
    FROM "agape_app_development_demo"."catalogs_categories"
),
subcat AS (
    SELECT id, full_name, category_id
    FROM "agape_app_development_demo"."catalogs_subcategories"
),
tax AS (
    SELECT id, code
    FROM "agape_app_development_demo"."finance_tax_group"
),
acc AS (
    SELECT id, code
    FROM "agape_app_development_demo"."finance_item_accounting_group"
),
vals AS (
    SELECT * FROM (VALUES
        ('LAP-HB',   'Lápiz grafito HB',                'HB clásico',                 'Lápiz para escritura y dibujo',                 'Escritura', 'Lápices',        'GRAVA_19', 'MER',  900.00),
        ('BOL-AZ',   'Bolígrafo azul 0.7',              'Tinta azul',                 'Bolígrafo punta fina 0.7',                      'Escritura', 'Bolígrafos',     'GRAVA_19', 'MER', 1500.00),
        ('MAR-NEG',  'Marcador permanente negro',      'Punta bisel',                'Marcador permanente para múltiples superficies', 'Escritura', 'Marcadores',     'GRAVA_19', 'MER', 4200.00),
        ('RES-AMA',  'Resaltador amarillo',             'Alta visibilidad',           'Resaltador fluorescente',                       'Escritura', 'Resaltadores',   'GRAVA_19', 'MER', 3800.00),
        ('COR-LIQ',  'Corrector líquido 20ml',          'Secado rápido',              'Corrector líquido',                             'Escritura', 'Correctores',    'GRAVA_19', 'MER', 4500.00),

        ('CUE-ARG100','Cuaderno argollado 100 hojas',   'Tamaño carta',               'Cuaderno argollado para uso escolar/oficina',    'Cuadernos', 'Argollados',     'GRAVA_19', 'MER', 12500.00),
        ('LIB-POC',  'Libreta pocket',                  'Bolsillo',                   'Libreta pequeña para notas rápidas',            'Cuadernos', 'Libretas',       'GRAVA_19', 'MER',  8000.00),

        ('RES-CAR75','Resma papel carta 75g (500h)',    'Papel bond',                 'Resma para impresión y fotocopia',              'Papel',     'Bond',           'GRAVA_19', 'MER', 24500.00),
        ('CAR-COL',  'Cartulina colores (pliego)',      'Variedad',                   'Cartulina para manualidades',                   'Papel',     'Cartulina',      'GRAVA_19', 'MER',  2500.00),
        ('OPA-BL',   'Opalina blanca 200g (x10)',       'Premium',                    'Paquete de opalina blanca 200g',                'Papel',     'Opalina',        'GRAVA_19', 'MER',  9000.00),

        ('CIN-TRA12','Cinta transparente 12mm',         'Adhesivo',                   'Cinta adhesiva transparente',                   'Oficina',   'Cintas Adhesivas','GRAVA_19', 'MER',  3200.00),
        ('PEG-BAR40','Pegante en barra 40g',            'Limpio',                     'Pegante en barra',                              'Oficina',   'Clips y Sujetadores','GRAVA_19','MER',  5200.00),
        ('TIE-ESC',  'Tijeras escolares',               'Punta roma',                 'Tijeras para uso escolar',                      'Escolar',   'Reglas y geometría','GRAVA_19','MER',  7800.00),
        ('REG-30',   'Regla 30 cm',                     'Plástica',                   'Regla plástica de 30 cm',                       'Escolar',   'Reglas y geometría','GRAVA_19','MER',  1800.00),
        ('BOR-BLA',  'Borrador blanco',                 'Suave',                      'Borrador para lápiz',                           'Escolar',   'Reglas y geometría','GRAVA_19','MER',  1200.00),
        ('SAC-MET',  'Sacapuntas metálico',             'Durable',                    'Sacapuntas de metal',                           'Escolar',   'Reglas y geometría','GRAVA_19','MER',  2200.00)
    ) AS v(code, full_name, slogan, description, category_name, subcategory_name, tax_group_code, acc_group_code, base_price)
)
INSERT INTO "agape_app_development_demo"."catalogs_item"
    ("code","full_name","slogan","description","type","is_enabled","rating","base_price",
     "category_id","subcategory_id","tax_group_id","item_accounting_group_id","images")
SELECT
    v.code,
    v.full_name,
    v.slogan,
    v.description,
    'good',
    true,
    0,
    v.base_price,
    c.id,
    sc.id,
    tg.id,
    ag.id,
    '[]'::jsonb
FROM vals v
JOIN cat c
  ON c.full_name = v.category_name
JOIN subcat sc
  ON sc.full_name = v.subcategory_name
 AND sc.category_id = c.id
JOIN tax tg
  ON tg.code = v.tax_group_code
JOIN acc ag
  ON ag.code = v.acc_group_code
ON CONFLICT ("code") DO UPDATE
SET
  "full_name"                = EXCLUDED."full_name",
  "slogan"                   = EXCLUDED."slogan",
  "description"              = EXCLUDED."description",
  "type"                     = EXCLUDED."type",
  "is_enabled"               = EXCLUDED."is_enabled",
  "rating"                   = EXCLUDED."rating",
  "base_price"               = EXCLUDED."base_price",
  "category_id"              = EXCLUDED."category_id",
  "subcategory_id"           = EXCLUDED."subcategory_id",
  "tax_group_id"             = EXCLUDED."tax_group_id",
  "item_accounting_group_id" = EXCLUDED."item_accounting_group_id",
  "images"                   = EXCLUDED."images";


-- ============================================================
-- 2) Crear/actualizar inventory_item (para todos los GOODS)
--    + asignar UOM base según el ítem
-- ============================================================
WITH uoms AS (
    SELECT id, code FROM "agape_app_development_demo"."inventory_unit_of_measure"
),
items AS (
    SELECT id, code
    FROM "agape_app_development_demo"."catalogs_item"
    WHERE type = 'good'
),
map AS (
    SELECT * FROM (VALUES
        ('LAP-HB',    'UND',  30::numeric,  0::numeric, 10::numeric),
        ('BOL-AZ',    'UND',  30::numeric,  0::numeric, 10::numeric),
        ('MAR-NEG',   'UND',  10::numeric,  0::numeric,  5::numeric),
        ('RES-AMA',   'UND',  10::numeric,  0::numeric,  5::numeric),
        ('COR-LIQ',   'UND',  10::numeric,  0::numeric,  5::numeric),

        ('CUE-ARG100','UND',  10::numeric,  0::numeric,  5::numeric),
        ('LIB-POC',   'UND',  10::numeric,  0::numeric,  5::numeric),

        ('RES-CAR75', 'RES',   5::numeric,  0::numeric,  2::numeric),
        ('CAR-COL',   'UND',  20::numeric,  0::numeric, 10::numeric),
        ('OPA-BL',    'PAQ',  10::numeric,  0::numeric,  5::numeric),

        ('CIN-TRA12', 'ROL',  10::numeric,  0::numeric,  5::numeric),
        ('PEG-BAR40', 'UND',  10::numeric,  0::numeric,  5::numeric),
        ('TIE-ESC',   'UND',   5::numeric,  0::numeric,  2::numeric),
        ('REG-30',    'UND',  10::numeric,  0::numeric,  5::numeric),
        ('BOR-BLA',   'UND',  20::numeric,  0::numeric, 10::numeric),
        ('SAC-MET',   'UND',  10::numeric,  0::numeric,  5::numeric)
    ) AS v(item_code, uom_code, min_stock, max_stock, reorder_point)
)
INSERT INTO "agape_app_development_demo"."inventory_item"
    ("item_id","uom_id","min_stock","max_stock","reorder_point")
SELECT
    i.id,
    u.id,
    m.min_stock,
    m.max_stock,
    m.reorder_point
FROM map m
JOIN items i ON i.code = m.item_code
JOIN uoms u  ON u.code = m.uom_code
ON CONFLICT ("item_id") DO UPDATE
SET
  "uom_id"        = EXCLUDED."uom_id",
  "min_stock"     = EXCLUDED."min_stock",
  "max_stock"     = EXCLUDED."max_stock",
  "reorder_point" = EXCLUDED."reorder_point";


-- ============================================================
-- 3) UOM alternas por ítem (inventory_item_uom)
--    (para el demo dejamos 1:1 con el UOM base)
-- ============================================================
INSERT INTO "agape_app_development_demo"."inventory_item_uom"
    ("item_id","uom_id","conversion_factor","is_enabled","is_default_purchase","is_default_sales")
SELECT
    ii.item_id,
    ii.uom_id,
    1::numeric,
    true,
    true,
    true
FROM "agape_app_development_demo"."inventory_item" ii
ON CONFLICT ("item_id","uom_id") DO UPDATE
SET
  "conversion_factor"   = EXCLUDED."conversion_factor",
  "is_enabled"          = EXCLUDED."is_enabled",
  "is_default_purchase" = EXCLUDED."is_default_purchase",
  "is_default_sales"    = EXCLUDED."is_default_sales";


-- ============================================================
-- 4) Stock inicial (inventory_stock) - valores FINALES (post-movimientos)
--    Locations (creadas en config seed):
--      - WH-PRIN  (Bodega Principal)
--      - STO-MOST (Mostrador)
-- ============================================================
WITH loc AS (
    SELECT id, code FROM "agape_app_development_demo"."inventory_location"
    WHERE code IN ('WH-PRIN','STO-MOST')
),
items AS (
    SELECT id, code FROM "agape_app_development_demo"."catalogs_item" WHERE type = 'good'
),
qty AS (
    -- qty_wh = stock en bodega principal (final)
    -- qty_st = stock en mostrador (final)
    SELECT * FROM (VALUES
        ('LAP-HB',     120::numeric,  17::numeric),
        ('BOL-AZ',      90::numeric,  12::numeric),
        ('MAR-NEG',     30::numeric,   6::numeric),
        ('RES-AMA',     25::numeric,   5::numeric),
        ('COR-LIQ',     20::numeric,   4::numeric),
        ('CUE-ARG100',  40::numeric,   8::numeric),
        ('LIB-POC',     35::numeric,   7::numeric),
        ('RES-CAR75',    8::numeric,   1::numeric),
        ('CAR-COL',     60::numeric,  10::numeric),
        ('OPA-BL',      20::numeric,   4::numeric),
        ('CIN-TRA12',   25::numeric,   6::numeric),
        ('PEG-BAR40',   18::numeric,   4::numeric),
        ('TIE-ESC',     10::numeric,   2::numeric),
        ('REG-30',      40::numeric,   8::numeric),
        ('BOR-BLA',     70::numeric,  12::numeric),
        ('SAC-MET',     25::numeric,   5::numeric)
    ) AS v(item_code, qty_wh, qty_st)
),
rows AS (
    SELECT
        i.id AS item_id,
        (SELECT id FROM loc WHERE code='WH-PRIN')  AS wh_id,
        (SELECT id FROM loc WHERE code='STO-MOST') AS st_id,
        q.qty_wh,
        q.qty_st
    FROM qty q
    JOIN items i ON i.code = q.item_code
)
INSERT INTO "agape_app_development_demo"."inventory_stock" ("item_id","location_id","quantity","reserved_quantity")
SELECT item_id, wh_id, qty_wh, 0 FROM rows
UNION ALL
SELECT item_id, st_id, qty_st, 0 FROM rows
ON CONFLICT ("item_id","location_id") DO UPDATE
SET
  "quantity"          = EXCLUDED."quantity",
  "reserved_quantity" = EXCLUDED."reserved_quantity";


-- ============================================================
-- 5) Movimientos de prueba (inventory_movement + detail)
--    Documentos fijos para idempotencia:
--      - ENTRADA  #1 (E-1)  -> “Entrada inicial”
--      - SALIDA   #1 (S-1)  -> “Venta mostrador”
--      - AJUSTE   #1 (A-1)  -> “Ajuste por daño”
-- ============================================================

-- Helper: empleado “root” (si existe), o el primer empleado activo
WITH emp AS (
    SELECT COALESCE(
        (SELECT su.employee_id FROM "agape_app_development_demo"."security_user" su WHERE su.username='root' LIMIT 1),
        (SELECT e.id FROM "agape_app_development_demo"."hr_employee" e WHERE e.is_active = true ORDER BY e.id LIMIT 1)
    ) AS employee_id
)
SELECT employee_id FROM emp; -- noop (solo para validar que existe)

-- ------------------------------------------------------------
-- 5.1 ENTRADA inicial (serie ENTRADA, doc #1)
-- ------------------------------------------------------------
WITH emp AS (
    SELECT COALESCE(
        (SELECT su.employee_id FROM "agape_app_development_demo"."security_user" su WHERE su.username='root' LIMIT 1),
        (SELECT e.id FROM "agape_app_development_demo"."hr_employee" e WHERE e.is_active = true ORDER BY e.id LIMIT 1)
    ) AS employee_id
),
mt AS (
    SELECT id FROM "agape_app_development_demo"."inventory_movement_type" WHERE name='Entrada' LIMIT 1
),
ser AS (
    SELECT id, prefix, suffix
    FROM "agape_app_development_demo"."numbering_document_series"
    WHERE series_code='ENTRADA'
      AND document_type_id = (SELECT id FROM "agape_app_development_demo"."numbering_document_type" WHERE code='INV_MOV' LIMIT 1)
    LIMIT 1
),
ins AS (
    INSERT INTO "agape_app_development_demo"."inventory_movement"
        ("movement_type_id","movement_date","observation","employee_id",
         "document_series_id","document_number","document_number_full")
    SELECT
        (SELECT id FROM mt),
        NOW() - INTERVAL '10 days',
        'Entrada inicial - Inventario de apertura (Papelería demo)',
        (SELECT employee_id FROM emp),
        (SELECT id FROM ser),
        1,
        COALESCE((SELECT prefix FROM ser),'') || '1' || COALESCE((SELECT suffix FROM ser),'')
    ON CONFLICT ("document_series_id","document_number") DO UPDATE
    SET
        "movement_type_id"      = EXCLUDED."movement_type_id",
        "movement_date"         = EXCLUDED."movement_date",
        "observation"           = EXCLUDED."observation",
        "employee_id"           = EXCLUDED."employee_id",
        "document_number_full"  = EXCLUDED."document_number_full"
    RETURNING id
),
del AS (
    DELETE FROM "agape_app_development_demo"."inventory_movement_detail"
    WHERE movement_id = (SELECT id FROM ins)
)
INSERT INTO "agape_app_development_demo"."inventory_movement_detail"
    ("movement_id","item_id","location_id","lot_id","quantity","unit_cost","total_cost")
SELECT
    (SELECT id FROM ins) AS movement_id,
    ci.id                AS item_id,
    loc.id               AS location_id,
    NULL                 AS lot_id,
    v.qty                AS quantity,
    v.unit_cost          AS unit_cost,
    (v.qty * v.unit_cost) AS total_cost
FROM (VALUES
    ('LAP-HB',     'WH-PRIN', 150::numeric,  450::numeric),
    ('BOL-AZ',     'WH-PRIN', 100::numeric,  900::numeric),
    ('CUE-ARG100', 'WH-PRIN',  50::numeric, 8500::numeric),
    ('RES-CAR75',  'WH-PRIN',  10::numeric,18000::numeric),
    ('MAR-NEG',    'WH-PRIN',  40::numeric, 2600::numeric)
) AS v(item_code, location_code, qty, unit_cost)
JOIN "agape_app_development_demo"."catalogs_item" ci ON ci.code = v.item_code
JOIN "agape_app_development_demo"."inventory_location" loc ON loc.code = v.location_code;


-- ------------------------------------------------------------
-- 5.2 SALIDA por venta (serie SALIDA, doc #1)
-- ------------------------------------------------------------
WITH emp AS (
    SELECT COALESCE(
        (SELECT su.employee_id FROM "agape_app_development_demo"."security_user" su WHERE su.username='root' LIMIT 1),
        (SELECT e.id FROM "agape_app_development_demo"."hr_employee" e WHERE e.is_active = true ORDER BY e.id LIMIT 1)
    ) AS employee_id
),
mt AS (
    SELECT id FROM "agape_app_development_demo"."inventory_movement_type" WHERE name='Venta' LIMIT 1
),
ser AS (
    SELECT id, prefix, suffix
    FROM "agape_app_development_demo"."numbering_document_series"
    WHERE series_code='SALIDA'
      AND document_type_id = (SELECT id FROM "agape_app_development_demo"."numbering_document_type" WHERE code='INV_MOV' LIMIT 1)
    LIMIT 1
),
ins AS (
    INSERT INTO "agape_app_development_demo"."inventory_movement"
        ("movement_type_id","movement_date","observation","employee_id",
         "document_series_id","document_number","document_number_full")
    SELECT
        (SELECT id FROM mt),
        NOW() - INTERVAL '3 days',
        'Venta mostrador - Movimiento de prueba (Papelería demo)',
        (SELECT employee_id FROM emp),
        (SELECT id FROM ser),
        1,
        COALESCE((SELECT prefix FROM ser),'') || '1' || COALESCE((SELECT suffix FROM ser),'')
    ON CONFLICT ("document_series_id","document_number") DO UPDATE
    SET
        "movement_type_id"      = EXCLUDED."movement_type_id",
        "movement_date"         = EXCLUDED."movement_date",
        "observation"           = EXCLUDED."observation",
        "employee_id"           = EXCLUDED."employee_id",
        "document_number_full"  = EXCLUDED."document_number_full"
    RETURNING id
),
del AS (
    DELETE FROM "agape_app_development_demo"."inventory_movement_detail"
    WHERE movement_id = (SELECT id FROM ins)
)
INSERT INTO "agape_app_development_demo"."inventory_movement_detail"
    ("movement_id","item_id","location_id","lot_id","quantity","unit_cost","total_cost")
SELECT
    (SELECT id FROM ins) AS movement_id,
    ci.id                AS item_id,
    loc.id               AS location_id,
    NULL                 AS lot_id,
    v.qty                AS quantity,
    NULL                 AS unit_cost,
    NULL                 AS total_cost
FROM (VALUES
    ('LAP-HB',   'STO-MOST', 3::numeric),
    ('BOL-AZ',   'STO-MOST', 2::numeric),
    ('BOR-BLA',  'STO-MOST', 1::numeric),
    ('REG-30',   'STO-MOST', 2::numeric)
) AS v(item_code, location_code, qty)
JOIN "agape_app_development_demo"."catalogs_item" ci ON ci.code = v.item_code
JOIN "agape_app_development_demo"."inventory_location" loc ON loc.code = v.location_code;


-- ------------------------------------------------------------
-- 5.3 AJUSTE de salida (serie AJUSTE, doc #1)
-- ------------------------------------------------------------
WITH emp AS (
    SELECT COALESCE(
        (SELECT su.employee_id FROM "agape_app_development_demo"."security_user" su WHERE su.username='root' LIMIT 1),
        (SELECT e.id FROM "agape_app_development_demo"."hr_employee" e WHERE e.is_active = true ORDER BY e.id LIMIT 1)
    ) AS employee_id
),
mt AS (
    SELECT id FROM "agape_app_development_demo"."inventory_movement_type" WHERE name='Ajuste de Salida' LIMIT 1
),
ser AS (
    SELECT id, prefix, suffix
    FROM "agape_app_development_demo"."numbering_document_series"
    WHERE series_code='AJUSTE'
      AND document_type_id = (SELECT id FROM "agape_app_development_demo"."numbering_document_type" WHERE code='INV_MOV' LIMIT 1)
    LIMIT 1
),
ins AS (
    INSERT INTO "agape_app_development_demo"."inventory_movement"
        ("movement_type_id","movement_date","observation","employee_id",
         "document_series_id","document_number","document_number_full")
    SELECT
        (SELECT id FROM mt),
        NOW() - INTERVAL '1 days',
        'Ajuste por daño - Movimiento de prueba (Papelería demo)',
        (SELECT employee_id FROM emp),
        (SELECT id FROM ser),
        1,
        COALESCE((SELECT prefix FROM ser),'') || '1' || COALESCE((SELECT suffix FROM ser),'')
    ON CONFLICT ("document_series_id","document_number") DO UPDATE
    SET
        "movement_type_id"      = EXCLUDED."movement_type_id",
        "movement_date"         = EXCLUDED."movement_date",
        "observation"           = EXCLUDED."observation",
        "employee_id"           = EXCLUDED."employee_id",
        "document_number_full"  = EXCLUDED."document_number_full"
    RETURNING id
),
del AS (
    DELETE FROM "agape_app_development_demo"."inventory_movement_detail"
    WHERE movement_id = (SELECT id FROM ins)
)
INSERT INTO "agape_app_development_demo"."inventory_movement_detail"
    ("movement_id","item_id","location_id","lot_id","quantity","unit_cost","total_cost")
SELECT
    (SELECT id FROM ins) AS movement_id,
    ci.id                AS item_id,
    loc.id               AS location_id,
    NULL                 AS lot_id,
    1::numeric           AS quantity,
    NULL                 AS unit_cost,
    NULL                 AS total_cost
FROM "agape_app_development_demo"."catalogs_item" ci
JOIN "agape_app_development_demo"."inventory_location" loc ON loc.code='WH-PRIN'
WHERE ci.code='MAR-NEG'
LIMIT 1;


-- ============================================================
-- 6) (Opcional) Actualizar current_number de las series usadas
--    para que el próximo consecutivo no choque con los docs #1
-- ============================================================
UPDATE "agape_app_development_demo"."numbering_document_series" ds
SET "current_number" = GREATEST(ds."current_number", 2)
WHERE ds."series_code" IN ('ENTRADA','SALIDA','AJUSTE')
  AND ds."document_type_id" = (SELECT id FROM "agape_app_development_demo"."numbering_document_type" WHERE code='INV_MOV' LIMIT 1);

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