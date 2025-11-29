-- Insert Products
WITH category_ids AS (
    SELECT id, "fullName"
    FROM "agape_app_development_demo"."inventory_categories"
),
subcategory_ids AS (
    SELECT id, "fullName", "categoryId"
    FROM "agape_app_development_demo"."inventory_subcategories"
)
INSERT INTO "agape_app_development_demo"."inventory_product" (
    "full_name", "slogan", "description", "is_active", "rating", "price", "category_id", "subcategory_id", "images"
)
SELECT
    p.full_name,
    p.slogan,
    p.description,
    true,
    p.rating,
    p.price,
    c.id,
    sc.id,
    '[]'::jsonb
FROM (
    VALUES
        ('Bolígrafo Gel Premium', 'Escritura suave', 'Bolígrafo de tinta gel color negro, punta fina 0.5mm.', 5, 12.50, 'Escritura', 'Bolígrafos'),
        ('Lápiz HB #2', 'Clásico y confiable', 'Lápiz de grafito resistente, ideal para escritura y dibujo.', 4, 1.50, 'Escritura', 'Lápices'),
        ('Marcadores Permanentes Set x4', 'Colores vibrantes', 'Set de marcadores permanentes punta redonda: negro, azul, rojo, verde.', 5, 25.00, 'Escritura', 'Marcadores'),

        ('Resma Papel Bond Carta', 'Blancura superior', '500 hojas de papel bond blanco tamaño carta, 75g.', 5, 45.00, 'Papel', 'Bond'),
        ('Papel Fotográfico Glossy', 'Impresiones brillantes', 'Paquete de 20 hojas papel fotográfico brillante A4.', 4, 35.00, 'Papel', 'Fotográfico'),

        ('Cuaderno Argollado 100 Hojas', 'Durable y práctico', 'Cuaderno cuadriculado con tapa dura y argolla doble O.', 5, 18.00, 'Cuadernos', 'Argollados'),
        ('Libreta de Notas Bolsillo', 'Llévala a todas partes', 'Pequeña libreta de apuntes con elástico.', 4, 8.00, 'Cuadernos', 'Libretas'),

        ('Grapadora Metálica', 'Resistencia industrial', 'Grapadora de escritorio cuerpo metálico, usa grapas estándar.', 5, 32.00, 'Oficina', 'Grapadoras'),
        ('Clips Mariposa x50', 'Organiza tus documentos', 'Caja de clips tipo mariposa grandes.', 3, 5.00, 'Oficina', 'Clips y Sujetadores'),

        ('Set Pinturas Acrílicas', 'Explora tu creatividad', '12 tubos de pintura acrílica de 12ml colores variados.', 5, 55.00, 'Arte', 'Pinturas'),
        ('Pinceles Surtidos x5', 'Para todo tipo de trazos', 'Set de pinceles redondos y planos de diferentes tamaños.', 4, 20.00, 'Arte', 'Pinceles')
) AS p(full_name, slogan, description, rating, price, category_name, subcategory_name)
JOIN category_ids c ON c."fullName" = p.category_name
JOIN subcategory_ids sc ON sc."fullName" = p.subcategory_name AND sc."categoryId" = c.id;


-- Insert Products demo AGAPE
WITH category_ids AS (
    SELECT id, "fullName"
    FROM "agape_app_development_demo"."inventory_categories"
),
subcategory_ids AS (
    SELECT id, "fullName", "categoryId"
    FROM "agape_app_development_demo"."inventory_subcategories"
)
INSERT INTO "agape_app_development_demo"."inventory_product" (
    "full_name", "slogan", "description", "is_active", "rating", "price", "category_id", "subcategory_id", "images"
)
SELECT
    p.full_name,
    p.slogan,
    p.description,
    true,
    p.rating,
    p.price,
    c.id,
    sc.id,
    '[]'::jsonb
FROM (
    VALUES
        -- ESCRITURA
        ('Bolígrafo Gel Azul Premium',
         'Suavidad que se siente al escribir',
         'Bolígrafo de tinta gel azul con cuerpo ergonómico y punta de 0.7 mm para escritura fluida.',
         5,
         4500.00,
         'Escritura',
         'Bolígrafos'),

        ('Lápiz Grafito HB Profesional',
         'El equilibrio perfecto para escribir y dibujar',
         'Lápiz de grafito con mina HB, resistente e ideal para estudiantes y artistas.',
         4,
         1000.00,
         'Escritura',
         'Lápices'),

        ('Marcador Permanente Negro ProLine',
         'Marcado fuerte y duradero',
         'Marcador permanente de punta fina ideal para plástico, madera, metal y cartón.',
         5,
         6000.00,
         'Escritura',
         'Marcadores'),

        -- PAPEL
        ('Papel Bond Carta 75g',
         'Calidad para impresión diaria',
         'Resma de 500 hojas tamaño carta, 75 g/m², ideal para impresoras láser y de inyección.',
         4,
         19900.00,
         'Papel',
         'Bond'),

        ('Papel Fotográfico Brillante 180g',
         'Tus fotos con vida propia',
         'Paquete de 50 hojas de papel fotográfico brillante 180 g, alta absorción de tinta.',
         5,
         24900.00,
         'Papel',
         'Fotográfico'),

        -- CUADERNOS
        ('Cuaderno Argollado Rayado 100 Hojas',
         'Durabilidad para tu día a día',
         'Cuaderno de tapa dura con diseño moderno, 100 hojas rayadas y argolla doble.',
         4,
         8500.00,
         'Cuadernos',
         'Argollados'),

        ('Libreta Bolsillo Eco',
         'Anota, crea, imagina',
         'Libreta ecológica tamaño bolsillo con tapa kraft y 80 hojas rayadas.',
         5,
         5900.00,
         'Cuadernos',
         'Libretas'),

        -- OFICINA
        ('Archivador A-Z Plastificado',
         'Organiza con estilo',
         'Archivador tipo A-Z con refuerzo metálico, lomo plastificado y ranuras de sujeción.',
         4,
         12500.00,
         'Oficina',
         'Archivadores'),

        -- ARTE
        ('Set de Pinceles Artísticos x10',
         'Control y precisión en cada trazo',
         'Set de 10 pinceles sintéticos variados para acuarela, óleo y acrílico.',
         5,
         22000.00,
         'Arte',
         'Pinceles'),

        ('Lienzo 30x40 cm Algodón Premium',
         'La base ideal para tu obra',
         'Lienzo de algodón 30x40 cm sobre bastidor de madera, triple imprimación con gesso.',
         5,
         18000.00,
         'Arte',
         'Lienzos')
) AS p(full_name, slogan, description, rating, price, category_name, subcategory_name)
JOIN category_ids c ON c."fullName" = p.category_name
JOIN subcategory_ids sc ON sc."fullName" = p.subcategory_name AND sc."categoryId" = c.id;
