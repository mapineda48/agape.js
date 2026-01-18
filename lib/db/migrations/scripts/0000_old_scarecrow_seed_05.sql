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
    (v.qty_wh + v.qty_st) AS quantity,
    ci.base_price * 0.7  AS unit_cost,
    ((v.qty_wh + v.qty_st) * ci.base_price * 0.7) AS total_cost
FROM (VALUES
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
JOIN "agape_app_development_demo"."catalogs_item" ci ON ci.code = v.item_code
CROSS JOIN (SELECT id FROM "agape_app_development_demo"."inventory_location" WHERE code='WH-PRIN') AS loc;


-- ------------------------------------------------------------
-- 5.1.1 CAPAS DE COSTO iniciales (FIFO)
-- ------------------------------------------------------------
INSERT INTO "agape_app_development_demo"."inventory_cost_layer"
    ("item_id", "location_id", "lot_id", "original_quantity", "remaining_quantity", "unit_cost", "source_movement_id", "created_at")
SELECT
    d.item_id,
    d.location_id,
    d.lot_id,
    d.quantity,
    d.quantity,
    d.unit_cost,
    d.movement_id,
    m.movement_date
FROM "agape_app_development_demo"."inventory_movement_detail" d
JOIN "agape_app_development_demo"."inventory_movement" m ON m.id = d.movement_id
WHERE m.document_number_full = (
    SELECT COALESCE(prefix,'') || '1' || COALESCE(suffix,'') 
    FROM "agape_app_development_demo"."numbering_document_series" 
    WHERE series_code='ENTRADA' 
    AND document_type_id = (SELECT id FROM "agape_app_development_demo"."numbering_document_type" WHERE code='INV_MOV' LIMIT 1)
)
ON CONFLICT DO NOTHING;


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
WHERE ds."series_code" IN ('ENTRADA','SALIDA','AJUSTE','OC')
  AND ds."document_type_id" IN (
    SELECT id FROM "agape_app_development_demo"."numbering_document_type" 
    WHERE code IN ('INV_MOV', 'PURCHASE_ORDER')
  );

