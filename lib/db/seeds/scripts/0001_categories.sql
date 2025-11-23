-- Insert Categories
WITH inserted_categories AS (
    INSERT INTO "agape_app_development_demo"."inventory_categories" ("fullName", "isEnabled")
    VALUES
        ('Escritura', true),
        ('Papel', true),
        ('Cuadernos', true),
        ('Oficina', true),
        ('Arte', true)
    RETURNING id, "fullName"
)
INSERT INTO "agape_app_development_demo"."inventory_subcategories" ("fullName", "isEnabled", "categoryId")
SELECT sub."fullName", true, ic.id
FROM inserted_categories ic
CROSS JOIN LATERAL (
    VALUES
        ('Bolígrafos', 'Escritura'),
        ('Lápices', 'Escritura'),
        ('Marcadores', 'Escritura'),
        ('Resaltadores', 'Escritura'),
        ('Plumas Fuente', 'Escritura'),

        ('Bond', 'Papel'),
        ('Periódico', 'Papel'),
        ('Fotográfico', 'Papel'),
        ('Cartulina', 'Papel'),
        ('Opalina', 'Papel'),

        ('Argollados', 'Cuadernos'),
        ('Cosidos', 'Cuadernos'),
        ('Grapados', 'Cuadernos'),
        ('Libretas', 'Cuadernos'),
        ('Agendas', 'Cuadernos'),

        ('Archivadores', 'Oficina'),
        ('Grapadoras', 'Oficina'),
        ('Perforadoras', 'Oficina'),
        ('Clips y Sujetadores', 'Oficina'),
        ('Cintas Adhesivas', 'Oficina'),

        ('Pinturas', 'Arte'),
        ('Pinceles', 'Arte'),
        ('Lienzos', 'Arte'),
        ('Arcilla', 'Arte'),
        ('Crayones', 'Arte')
) AS sub("fullName", "categoryName")
WHERE ic."fullName" = sub."categoryName";
