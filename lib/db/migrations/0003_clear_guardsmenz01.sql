BEGIN; -- ROLLBACK;

-- Fijamos el schema por defecto para todas las sentencias siguientes
SET search_path TO "agape_app_demo_development";

-- 2) Trunco todas las tablas juntas, en cascada y reinicio las identidades
TRUNCATE TABLE 
    inventory_product,
    inventory_subcategories,
    inventory_categories
RESTART IDENTITY
CASCADE;

WITH ins_cat AS (
  INSERT INTO inventory_categories ("fullName", "isEnabled")
  VALUES
    ('Papelería general',        TRUE),
    ('Útiles escolares',         TRUE),
    ('Material de oficina',      TRUE),
    ('Escritura',                TRUE),
    ('Carpetas y archivadores',   TRUE),
    ('Papel y blocs',            TRUE),
    ('Adhesivos y cintas',       TRUE),
    ('Manualidades y arte',      TRUE),
    ('Tecnología y electrónica', TRUE),
    ('Suministros de impresión', TRUE)
  RETURNING "id", "fullName"
)
INSERT INTO inventory_subcategories ("fullName", "isEnabled", "categoryId")
SELECT sub."fullName", sub."isEnabled", cat.id
FROM (
  VALUES
    -- Papelería general
    ('Lápices',                   TRUE, 'Papelería general'),
    ('Borradores',                TRUE, 'Papelería general'),
    ('Marcadores',                TRUE, 'Papelería general'),

    -- Útiles escolares
    ('Cuadernos',                 TRUE, 'Útiles escolares'),
    ('Agendas',                   TRUE, 'Útiles escolares'),
    ('Reglas',                    TRUE, 'Útiles escolares'),

    -- Material de oficina
    ('Grapadoras',                TRUE, 'Material de oficina'),
    ('Taladros de papel',         TRUE, 'Material de oficina'),
    ('Post-it',                   TRUE, 'Material de oficina'),

    -- Escritura
    ('Bolígrafos',                TRUE, 'Escritura'),
    ('Rotuladores',               TRUE, 'Escritura'),
    ('Plumas estilográficas',     TRUE, 'Escritura'),

    -- Carpetas y archivadores
    ('Carpetas plásticas',        TRUE, 'Carpetas y archivadores'),
    ('Archivadores metálicos',    TRUE, 'Carpetas y archivadores'),
    ('Portadocumentos',           TRUE, 'Carpetas y archivadores'),

    -- Papel y blocs
    ('Hojas tamaño carta',        TRUE, 'Papel y blocs'),
    ('Blocks de dibujo',          TRUE, 'Papel y blocs'),
    ('Bloc de notas',             TRUE, 'Papel y blocs'),

    -- Adhesivos y cintas
    ('Cinta adhesiva transparente',TRUE, 'Adhesivos y cintas'),
    ('Pegamento en barra',        TRUE, 'Adhesivos y cintas'),
    ('Cinta de doble cara',       TRUE, 'Adhesivos y cintas'),

    -- Manualidades y arte
    ('Pinturas acrílicas',        TRUE, 'Manualidades y arte'),
    ('Pinceles artísticos',       TRUE, 'Manualidades y arte'),
    ('Cartulinas',                TRUE, 'Manualidades y arte'),

    -- Tecnología y electrónica
    ('Calculadoras científicas',  TRUE, 'Tecnología y electrónica'),
    ('Memorias USB',              TRUE, 'Tecnología y electrónica'),
    ('Tabletas gráficas',         TRUE, 'Tecnología y electrónica'),

    -- Suministros de impresión
    ('Tóner para impresoras',     TRUE, 'Suministros de impresión'),
    ('Cartuchos de tinta',        TRUE, 'Suministros de impresión'),
    ('Papel fotográfico',         TRUE, 'Suministros de impresión')
) AS sub("fullName", "isEnabled", "catName")
JOIN ins_cat AS cat
  ON cat."fullName" = sub."catName"
;

COMMIT;