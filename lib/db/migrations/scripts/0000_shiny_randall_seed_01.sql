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