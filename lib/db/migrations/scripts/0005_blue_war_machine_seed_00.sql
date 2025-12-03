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


INSERT INTO "agape_app_development_demo"."inventory_location" (name, is_enabled)
VALUES ('Principal', true);

INSERT INTO "agape_app_development_demo"."inventory_movement_type" (name, factor, affects_stock, is_enabled)
VALUES
  ('Entrada', 1, true, true),
  ('Salida', -1, true, true),
  ('Transferencia', 1, true, true);

INSERT INTO "agape_app_development_demo"."person" (first_name, last_name, birthdate, email, phone, address)
VALUES
  ('Carlos', 'Ramírez', '1985-03-10 00:00:00', 'contacto@papeleriaelmundial.com', '555-100-2000', 'Av. Central #123'),
  ('María', 'González', '1979-07-22 00:00:00', 'ventas@escolaresluna.com', '555-300-2200', 'Calle Estrella #45'),
  ('Roberto', 'Santos', '1988-11-12 00:00:00', 'info@compusur.com', '555-900-4400', 'Blvd. Tecnológico #501'),
  ('Laura', 'Pineda', '1990-02-05 00:00:00', 'servicios@impresionesmax.com', '555-120-8899', 'Av. Hidalgo #88'),
  ('Javier', 'Lopez', '1982-10-30 00:00:00', 'contacto@artelite.com', '555-800-1234', 'Calle Arte #12');

INSERT INTO "agape_app_development_demo"."purchasing_supplier" (person_id, supplier_type_id)
VALUES
  (2, 1),  -- Papelería El Mundial
  (3, 2),  -- Escolares Luna
  (4, 3),  -- CompuSur
  (5, 4),  -- Impresiones Max
  (6, 6);  -- ArtElite
