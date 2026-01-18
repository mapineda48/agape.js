INSERT INTO "agape_app_development_demo"."crm_order_type" ("id", "name", "disabled")
VALUES 
    (1, 'Pedido Estándar', false),
    (2, 'Venta Mostrador', false),
    (3, 'Pedido Online', false)
ON CONFLICT (id) DO UPDATE SET
    "name" = EXCLUDED."name",
    "disabled" = EXCLUDED."disabled";

-- Sincronizar la secuencia del serial id
SELECT setval(pg_get_serial_sequence('"agape_app_development_demo"."crm_order_type"', 'id'), (SELECT MAX(id) FROM "agape_app_development_demo"."crm_order_type"));
