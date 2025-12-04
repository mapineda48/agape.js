-- Aseguramos un tipo de documento base para personas (si ya existe, no pasa nada)
INSERT INTO "agape_app_development_demo"."document_type"
    ("code", "name", "is_enabled", "applies_to_person", "applies_to_company")
VALUES
    ('CC', 'Cédula de ciudadanía', true, true, false)
ON CONFLICT ("code") DO NOTHING;

BEGIN;

WITH person_doc_type AS (
    SELECT id AS document_type_id
    FROM "agape_app_development_demo"."document_type"
    WHERE code = 'CC'
),

-- 1) Creamos el usuario "raíz"
new_user AS (
    INSERT INTO "agape_app_development_demo"."user"
        (user_type, document_type_id, document_number, email, phone, address)
    SELECT
        'employee',
        person_doc_type.document_type_id,
        '000000000000',
        'root@agape.com',
        '000000000000',
        'N/A'
    FROM person_doc_type
    RETURNING id
),

-- 2) Creamos el core_person con el mismo id del user
new_core_person AS (
    INSERT INTO "agape_app_development_demo"."core_person"
        (id, first_name, last_name, birthdate)
    SELECT
        u.id,
        'Miguel',
        'Pineda',
        NOW()::date
    FROM new_user u
    RETURNING id
),

-- 3) Rol de staff
new_role AS (
    INSERT INTO "agape_app_development_demo"."staff_role"
        (code, name, description, is_active)
    VALUES ('SP', 'super user', 'super user', true)
    RETURNING id
),

-- 4) Empleado: id = id de core_person
new_employee AS (
    INSERT INTO "agape_app_development_demo"."staff_employee"
        (id, hire_date, is_active, metadata, avatar_url)
    SELECT
        p.id,
        NOW(),
        true,
        NULL,
        '/admin.jpg'
    FROM new_core_person p
    RETURNING id
),

-- 5) Asignar rol al empleado
ins_employee_role AS (
    INSERT INTO "agape_app_development_demo"."staff_employee_roles"
        (employee_id, role_id)
    SELECT e.id, r.id
    FROM new_employee e, new_role r
    RETURNING employee_id, role_id
),

-- 6) Usuario de acceso
ins_access_user AS (
    INSERT INTO "agape_app_development_demo"."access_employee"
        (employee_id, username, password_hash)
    SELECT
        e.id,
        'root',
        'sera_que_esta_contraseña_sirve_señor_hacker?'
    FROM new_employee e
    RETURNING id AS access_user_id
)
SELECT
    (SELECT id FROM new_user)           AS user_id,
    (SELECT id FROM new_core_person)    AS core_person_id,
    (SELECT id FROM new_role)           AS role_id,
    (SELECT id FROM new_employee)       AS employee_id,
    (SELECT access_user_id FROM ins_access_user) AS access_user_id;

COMMIT;


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


INSERT INTO "agape_app_development_demo"."crm_client_type" ("name", "is_enabled")
VALUES
  ('Regular', true),
  ('VIP', true),
  ('Ocasional', true),
  ('Corporativo', true),
  ('Distribuidor', true),
  ('Mayorista', true),
  ('Minorista', true),
  ('Prospecto', true);

INSERT INTO "agape_app_development_demo"."purchasing_supplier_type" (name) VALUES
  ('Papelería y material de oficina'),
  ('Proveedor de artículos escolares'),
  ('Distribuidor de tecnología y cómputo'),
  ('Impresión y copiado'),
  ('Proveedor de mobiliario'),
  ('Suministros de arte y manualidades'),
  ('Servicios de mensajería y paquetería'),
  ('Distribuidor mayorista'),
  ('Proveedor de limpieza'),
  ('Servicios generales');


-- Tipo de documento de numeración para movimientos de inventario
INSERT INTO "agape_app_development_demo"."numeration_document_type"
    ("code", "name", "description", "module", "is_enabled")
VALUES
    ('INV_MOV', 'Movimiento de Inventario', 'Documentos de movimientos de inventario', 'inventory', true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "agape_app_development_demo"."inventory_location" (name, is_enabled)
VALUES ('Principal', true);

-- Tipos de movimiento de inventario, ligados al tipo de documento de numeración
WITH inv_doc_type AS (
    SELECT id
    FROM "agape_app_development_demo"."numeration_document_type"
    WHERE code = 'INV_MOV'
)
INSERT INTO "agape_app_development_demo"."inventory_movement_type"
    (name, factor, affects_stock, is_enabled, document_type_id)
SELECT
    v.name,
    v.factor,
    v.affects_stock,
    v.is_enabled,
    inv_doc_type.id
FROM inv_doc_type,
     (VALUES
        ('Entrada', 1, true, true),
        ('Salida', -1, true, true),
        ('Transferencia', 1, true, true)
     ) AS v(name, factor, affects_stock, is_enabled);

-- Aseguramos de nuevo que exista tipo de documento de persona
INSERT INTO "agape_app_development_demo"."document_type"
    ("code", "name", "is_enabled", "applies_to_person", "applies_to_company")
VALUES
    ('CC', 'Cédula de ciudadanía', true, true, false)
ON CONFLICT ("code") DO NOTHING;

WITH person_doc_type AS (
    SELECT id AS document_type_id
    FROM "agape_app_development_demo"."document_type"
    WHERE code = 'CC'
),
supplier_data AS (
    SELECT *
    FROM (VALUES
      ('Carlos',  'Ramírez',  '1985-03-10', 'contacto@papeleriaelmundial.com', '555-100-2000', 'Av. Central #123',        '900001', 'Papelería y material de oficina'),
      ('María',   'González', '1979-07-22', 'ventas@escolaresluna.com',        '555-300-2200', 'Calle Estrella #45',      '900002', 'Proveedor de artículos escolares'),
      ('Roberto', 'Santos',   '1988-11-12', 'info@compusur.com',               '555-900-4400', 'Blvd. Tecnológico #501', '900003', 'Distribuidor de tecnología y cómputo'),
      ('Laura',   'Pineda',   '1990-02-05', 'servicios@impresionesmax.com',    '555-120-8899', 'Av. Hidalgo #88',        '900004', 'Impresión y copiado'),
      ('Javier',  'Lopez',    '1982-10-30', 'contacto@artelite.com',           '555-800-1234', 'Calle Arte #12',         '900005', 'Suministros de arte y manualidades')
    ) AS v(first_name, last_name, birthdate, email, phone, address, document_number, supplier_type_name)
),
new_users AS (
    INSERT INTO "agape_app_development_demo"."user"
        (user_type, document_type_id, document_number, email, phone, address)
    SELECT
        'supplier',
        pdt.document_type_id,
        sd.document_number,
        sd.email,
        sd.phone,
        sd.address
    FROM supplier_data sd
    CROSS JOIN person_doc_type pdt
    RETURNING id, document_number
),
new_core_person AS (
    INSERT INTO "agape_app_development_demo"."core_person"
        (id, first_name, last_name, birthdate)
    SELECT
        u.id,
        sd.first_name,
        sd.last_name,
        sd.birthdate::timestamp with time zone
    FROM new_users u
    JOIN supplier_data sd ON sd.document_number = u.document_number
    RETURNING id
)
INSERT INTO "agape_app_development_demo"."purchasing_supplier"
    (id, supplier_type_id)
SELECT
    u.id,
    st.id
FROM new_users u
JOIN supplier_data sd
    ON sd.document_number = u.document_number
JOIN "agape_app_development_demo"."purchasing_supplier_type" st
    ON st.name = sd.supplier_type_name;
