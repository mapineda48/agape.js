-- ============================================================
-- Seed 00 (CONFIG) - Demo Papelería
-- Solo datos de configuración / maestros del sistema
-- ============================================================

BEGIN;

-- ============================================================
-- 0. Tipos de documento (identidad) - por seguridad (root ya lo hace)
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