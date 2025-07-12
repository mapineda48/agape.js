BEGIN; -- ROLLBACK

-- Fijamos el schema por defecto para todas las sentencias siguientes
SET search_path TO "agape_app_demo_development";

-- 2) Bloque con variables para categoría y subcategoría
DO $$
DECLARE
  cat_papeleria_general_id INT;
  sub_lapices_id INT;
  sub_borradores_id INT;
  sub_marcadores_id INT;

  cat_utiles_escolares_id INT;
  sub_cuadernos_id INT;
  sub_agendas_id INT;
  sub_reglas_id INT;

  cat_material_oficina_id INT;
  sub_grapadoras_id INT;
  sub_taladros_id INT;
  sub_postit_id INT;

  cat_escritura_id INT;
  sub_boligrafos_id INT;
  sub_rotuladores_id INT;
  sub_plumas_id INT;

  cat_carpetas_id INT;
  sub_carpetas_plasticas_id INT;
  sub_archivadores_metalicos_id INT;
  sub_portadocumentos_id INT;

  cat_papel_blocs_id INT;
  sub_hojas_carta_id INT;
  sub_blocks_dibujo_id INT;
  sub_bloc_notas_id INT;

  cat_adhesivos_id INT;
  sub_cinta_transparente_id INT;
  sub_pegamento_barra_id INT;
  sub_cinta_doble_cara_id INT;

  cat_manualidades_id INT;
  sub_pinturas_id INT;
  sub_pinceles_id INT;
  sub_cartulinas_id INT;

  cat_tecnologia_id INT;
  sub_calculadoras_id INT;
  sub_memorias_usb_id INT;
  sub_tabletas_id INT;

  cat_impresion_id INT;
  sub_toner_id INT;
  sub_cartuchos_id INT;
  sub_papel_foto_id INT;
BEGIN
  -- Obtengo una sola vez los IDs
  SELECT id INTO cat_papeleria_general_id
    FROM inventory_categories
   WHERE "fullName" = 'Papelería general';

  SELECT id INTO sub_lapices_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Lápices';

  SELECT id INTO sub_borradores_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Borradores';

  SELECT id INTO sub_marcadores_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Marcadores';

  -- 3) Inserto 5 productos usando las variables
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Lápiz Cero-Goma',      'Escritura sin manchas',     'Con goma incorporada para borrar sin ensuciar.',     TRUE, 4, 0.80, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Lápiz Color Pastel',   'Tonos suaves y elegantes',  'Pack de 6 lápices en colores pastel de alta calidad.', TRUE, 3, 4.50, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Lápiz Grafito 4H',     'Precisión en líneas claras', 'Mina dura 4H para trazos muy finos y precisos.',      TRUE, 5, 0.60, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Lápiz de Carpintero',   'Medición y marcaje',        'Forma hexagonal ancha para marcar madera.',           TRUE, 4, 1.20, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Lápiz para Rotular',   'Tinta permanente',          'Mina resistente al agua, ideal para rotulación.',     TRUE, 5, 1.95, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Lápiz HB Classic', 'El lápiz imprescindible', 'Mina HB estándar para uso diario.', TRUE, 4, 0.50, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Lápiz Mecánico 0.5mm', 'Precisión en cada trazo', 'Repuestos de mina 0.5 mm, clip metálico.', TRUE, 5, 2.75, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Set Lápices de Colores', '12 tonos vibrantes', 'Estuche con 12 lápices de alta pigmentación.', TRUE, 4, 3.20, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Lápiz Carbone 2B', 'Sombreado profesional', 'Mina 2B suave, ideal para bocetos.', TRUE, 5, 0.65, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Lápiz Triangular Ergonómico', 'Comodidad extra', 'Diseño antideslizante, mina HB.', TRUE, 4, 1.10, cat_papeleria_general_id, sub_lapices_id, '[]'),
    ('Borrador Blanco Suave', 'Borrado limpio sin dejar residuos', 'Goma blanca de alta calidad, no raya el papel y elimina marcas sin ensuciar.', TRUE, 4, 0.75, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Borrador de Vinilo Profesional', 'Precisión en cada trazo', 'Compuesto de vinilo, ideal para grafito y tinta, no se deshace al borrar.', TRUE, 5, 1.50, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Set de Gomas de Colores', 'Diversión y función en uno', 'Pack de 6 borradores de colores surtidos, formatos pequeños para detalle.', TRUE, 3, 2.20, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Borrador Antipolvo XL', 'Elimina residuos al instante', 'Tamaño extra grande, minimiza el polvo al borrar y dura más.', TRUE, 4, 1.10, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Borrador Mixto Grafito y Tinta', 'Versátil para todo tipo de marcas', 'Un lado para grafito y otro para tinta, perfecto para bocetos y correcciones.', TRUE, 5, 1.95, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Goma Ovalada Ergonómica', 'Diseño cómodo para el uso diario', 'Su forma ovalada se adapta a la mano y facilita el borrado en áreas amplias.', TRUE, 4, 0.85, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Borrador Lápiz con Cepillo', 'Dos funciones en uno', 'Borra con un extremo y limpia el polvo con el otro, ideal para dibujos técnicos.', TRUE, 5, 2.40, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Borrador de Precisión', 'Borrado exacto sin esfuerzo', 'Goma con punta fina para borrar pequeños detalles sin afectar el entorno.', TRUE, 4, 1.25, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Mini Gomas Surtidas', 'Ideales para kits escolares', 'Set de 10 mini gomas con diferentes formas y colores, perfectas para niños.', TRUE, 4, 2.10, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Goma Eléctrica Recargable', 'Tecnología para artistas y diseñadores', 'Borrador eléctrico de precisión, incluye cabezales reemplazables y cargador USB.', TRUE, 5, 8.90, cat_papeleria_general_id, sub_borradores_id, '[]'),
    ('Marcador Permanente Negro', 'Escribe sobre cualquier superficie', 'Tinta indeleble de secado rápido, resistente al agua.', TRUE, 5, 1.20, cat_papeleria_general_id, sub_marcadores_id, '[]'),
    ('Marcador Fluorescente Amarillo', 'Ideal para resaltar texto', 'Color brillante que no traspasa el papel.', TRUE, 4, 0.90, cat_papeleria_general_id, sub_marcadores_id, '[]'),
    ('Set de Marcadores de Colores', 'Organiza tus ideas con color', 'Incluye 6 marcadores en tonos vibrantes para uso escolar y profesional.', TRUE, 4, 4.50, cat_papeleria_general_id, sub_marcadores_id, '[]'),
    ('Marcador de Pizarra Blanca Azul', 'Borrado fácil y limpio', 'Tinta seca para pizarras blancas, sin olor fuerte.', TRUE, 4, 1.10, cat_papeleria_general_id, sub_marcadores_id, '[]'),
    ('Marcador Punta Fina Rojo', 'Precisión en cada trazo', 'Ideal para subrayar o escribir con detalle, punta de 0.4mm.', TRUE, 5, 1.30, cat_papeleria_general_id, sub_marcadores_id, '[]'),
    ('Marcador Textil Permanente', 'Diseña sobre tela sin preocupaciones', 'Tinta resistente al lavado, ideal para camisetas y mochilas.', TRUE, 5, 2.75, cat_papeleria_general_id, sub_marcadores_id, '[]'),
    ('Marcador para CD/DVD', 'Etiquetado sin dañar tus discos', 'Punta fina y tinta de secado rápido para superficies plásticas.', TRUE, 4, 1.50, cat_papeleria_general_id, sub_marcadores_id, '[]'),
    ('Set Marcadores de Pizarra Recargables', 'Más ecológicos, menos desechos', 'Incluye tinta de recarga y 4 colores básicos.', TRUE, 4, 5.80, cat_papeleria_general_id, sub_marcadores_id, '[]'),
    ('Marcador Metálico Dorado', 'Escritura brillante sobre superficies oscuras', 'Ideal para tarjetas, decoración y manualidades.', TRUE, 5, 2.20, cat_papeleria_general_id, sub_marcadores_id, '[]'),
    ('Marcador Borrable con Agua', 'Perfecto para pizarras de cristal', 'Tinta que se limpia fácilmente sin dejar manchas.', TRUE, 4, 1.90, cat_papeleria_general_id, sub_marcadores_id, '[]');

  -- IDs de categoría y subcategorías
  SELECT id INTO cat_utiles_escolares_id
    FROM inventory_categories
   WHERE "fullName" = 'Útiles escolares';

  SELECT id INTO sub_cuadernos_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Cuadernos';

  SELECT id INTO sub_agendas_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Agendas';

  SELECT id INTO sub_reglas_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Reglas';

  -- Cuadernos
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Cuaderno Profesional 100 hojas', 'Ideal para oficina o universidad', 'Papel de alta calidad, rayado, con espiral metálico.', TRUE, 5, 4.50, cat_utiles_escolares_id, sub_cuadernos_id, '[]'),
    ('Cuaderno Infantil de Dibujo', 'Creatividad para los más pequeños', 'Hojas blancas gruesas para dibujo con crayones o marcadores.', TRUE, 4, 3.25, cat_utiles_escolares_id, sub_cuadernos_id, '[]'),
    ('Cuaderno Cuadro Pequeño', 'Organización precisa', 'Perfecto para matemáticas, 80 hojas, tapa dura.', TRUE, 5, 3.90, cat_utiles_escolares_id, sub_cuadernos_id, '[]'),
    ('Cuaderno Tapa Flexible Ecológico', 'Responsable con el planeta', 'Hecho con papel reciclado, 60 hojas.', TRUE, 4, 2.80, cat_utiles_escolares_id, sub_cuadernos_id, '[]'),
    ('Pack Cuadernos Universitarios x3', 'Más por menos', 'Pack de 3 cuadernos con espiral y tapas resistentes.', TRUE, 4, 8.90, cat_utiles_escolares_id, sub_cuadernos_id, '[]');

  -- Agendas
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Agenda Ejecutiva 2025', 'Organiza tu año con estilo', 'Formato semanal, cubierta de cuero sintético.', TRUE, 5, 6.80, cat_utiles_escolares_id, sub_agendas_id, '[]'),
    ('Agenda Escolar Semanal', 'Perfecta para clases y tareas', 'Espacio para horarios y notas, con calendario académico.', TRUE, 4, 3.75, cat_utiles_escolares_id, sub_agendas_id, '[]'),
    ('Agenda Creativa Bullet Journal', 'Diseña tu propia organización', 'Páginas punteadas, ideal para personalizar tu estilo.', TRUE, 5, 5.50, cat_utiles_escolares_id, sub_agendas_id, '[]'),
    ('Mini Agenda de Bolsillo', 'Siempre contigo', 'Agenda diaria en tamaño compacto, con elástico de cierre.', TRUE, 4, 2.60, cat_utiles_escolares_id, sub_agendas_id, '[]'),
    ('Agenda con Stickers y Separadores', 'Planificación divertida', 'Incluye accesorios para decorar y separar secciones.', TRUE, 5, 7.20, cat_utiles_escolares_id, sub_agendas_id, '[]');

  -- Reglas
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Regla Plástica 30cm Transparente', 'Medición clara y precisa', 'Ideal para estudiantes, resistente y flexible.', TRUE, 4, 1.10, cat_utiles_escolares_id, sub_reglas_id, '[]'),
    ('Regla de Madera Clásica', 'Tradición en la escuela', 'Fabricada en madera pulida, con bordes redondeados.', TRUE, 4, 0.90, cat_utiles_escolares_id, sub_reglas_id, '[]'),
    ('Regla Flexible de Silicona', '¡No se rompe!', 'Se dobla sin perder la forma, colores surtidos.', TRUE, 5, 1.50, cat_utiles_escolares_id, sub_reglas_id, '[]'),
    ('Set de Reglas Geométricas', 'Todo en uno', 'Incluye regla, escuadra, cartabón y transportador.', TRUE, 5, 3.40, cat_utiles_escolares_id, sub_reglas_id, '[]'),
    ('Regla Metálica Profesional', 'Precisión para diseño técnico', 'Acero inoxidable, borde grabado con láser.', TRUE, 5, 2.80, cat_utiles_escolares_id, sub_reglas_id, '[]');

  -- IDs de categoría y subcategorías
  SELECT id INTO cat_material_oficina_id
    FROM inventory_categories
   WHERE "fullName" = 'Material de oficina';

  SELECT id INTO sub_grapadoras_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Grapadoras';

  SELECT id INTO sub_taladros_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Taladros de papel';

  SELECT id INTO sub_postit_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Post-it';

  -- Grapadoras
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Grapadora Metálica Clásica', 'Durabilidad y fuerza en tu escritorio', 'Grapa hasta 20 hojas, estructura metálica con mango ergonómico.', TRUE, 5, 4.90, cat_material_oficina_id, sub_grapadoras_id, '[]'),
    ('Mini Grapadora Portátil', 'Pequeña pero poderosa', 'Ideal para llevar, incluye 1 caja de grapas.', TRUE, 4, 2.50, cat_material_oficina_id, sub_grapadoras_id, '[]'),
    ('Grapadora de Largo Alcance', 'Perfecta para encuadernación', 'Hasta 30 cm de profundidad, ajustable para folletos.', TRUE, 4, 8.20, cat_material_oficina_id, sub_grapadoras_id, '[]'),
    ('Grapadora Antibloqueo', 'Sin atascos, sin estrés', 'Sistema de grapado suave con menos fuerza necesaria.', TRUE, 5, 6.10, cat_material_oficina_id, sub_grapadoras_id, '[]'),
    ('Grapadora Eléctrica USB', 'Automatiza tu productividad', 'Conexión USB, hasta 25 hojas, uso silencioso.', TRUE, 5, 12.75, cat_material_oficina_id, sub_grapadoras_id, '[]');

  -- Taladros de papel
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Perforadora de 2 Huecos', 'Precisión para tus archivadores', 'Capacidad de hasta 15 hojas, guía de papel ajustable.', TRUE, 4, 3.80, cat_material_oficina_id, sub_taladros_id, '[]'),
    ('Taladro de 3 Huecos Reforzado', 'Más fuerza, menos esfuerzo', 'Ideal para oficina con gran volumen de documentos.', TRUE, 5, 7.60, cat_material_oficina_id, sub_taladros_id, '[]'),
    ('Perforadora Escolar Básica', 'Ligera y funcional', 'Perfecta para el día a día estudiantil.', TRUE, 3, 2.40, cat_material_oficina_id, sub_taladros_id, '[]'),
    ('Taladro de Papel Ajustable', 'Para documentos especiales', 'Separación regulable para diferentes estándares.', TRUE, 4, 5.90, cat_material_oficina_id, sub_taladros_id, '[]'),
    ('Taladro Industrial Pesado', 'Para centros de copiado y archivo', 'Hasta 50 hojas, mango reforzado.', TRUE, 5, 14.30, cat_material_oficina_id, sub_taladros_id, '[]');

  -- Post-it
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Post-it Amarillo Clásico 76x76mm', 'Notas rápidas que se adhieren y despegan', 'Pack de 100 hojas, adhesivo removible sin residuos.', TRUE, 5, 1.20, cat_material_oficina_id, sub_postit_id, '[]'),
    ('Notas Adhesivas Multicolor', 'Organiza con estilo', '5 bloques de colores surtidos, 400 hojas en total.', TRUE, 4, 3.10, cat_material_oficina_id, sub_postit_id, '[]'),
    ('Post-it con Formas Divertidas', 'Ideal para recordatorios creativos', 'Diseños de estrella, corazón y nube.', TRUE, 5, 2.80, cat_material_oficina_id, sub_postit_id, '[]'),
    ('Notas Adhesivas con Separadores', 'Organización nivel pro', 'Incluye pestañas señaladoras de colores.', TRUE, 4, 2.50, cat_material_oficina_id, sub_postit_id, '[]'),
    ('Post-it con Papel Reciclado', 'Sostenible y funcional', 'Fabricado con papel reciclado, adhesivo ecológico.', TRUE, 5, 1.90, cat_material_oficina_id, sub_postit_id, '[]');

  -- IDs de categoría y subcategorías
  SELECT id INTO cat_escritura_id
    FROM inventory_categories
   WHERE "fullName" = 'Escritura';

  SELECT id INTO sub_boligrafos_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Bolígrafos';

  SELECT id INTO sub_rotuladores_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Rotuladores';

  SELECT id INTO sub_plumas_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Plumas estilográficas';

  -- Bolígrafos
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Bolígrafo Azul Retráctil', 'Escritura suave y sin manchas', 'Tinta de gel, punta media, clip metálico.', TRUE, 5, 1.10, cat_escritura_id, sub_boligrafos_id, '[]'),
    ('Bolígrafo Negro de Tinta Seca', 'Ideal para oficina', 'Tinta de secado rápido, no traspasa el papel.', TRUE, 4, 0.95, cat_escritura_id, sub_boligrafos_id, '[]'),
    ('Pack de 10 Bolígrafos Surtidos', 'Variedad y color en tu estuche', 'Tinta azul, negra, roja y verde. Punta de 1.0mm.', TRUE, 4, 4.20, cat_escritura_id, sub_boligrafos_id, '[]'),
    ('Bolígrafo Borrable', 'Corrige fácilmente sin tachones', 'Tinta térmica que se borra con fricción.', TRUE, 5, 2.30, cat_escritura_id, sub_boligrafos_id, '[]'),
    ('Bolígrafo Metálico Premium', 'Presentación elegante y profesional', 'Incluye estuche, recargable.', TRUE, 5, 6.90, cat_escritura_id, sub_boligrafos_id, '[]');

  -- Rotuladores
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Rotulador Permanente Negro', 'Escribe sobre todo', 'Resistente al agua, punta biselada.', TRUE, 4, 1.25, cat_escritura_id, sub_rotuladores_id, '[]'),
    ('Set de Rotuladores de Colores', 'Para arte o estudio', '12 colores vibrantes, tinta al agua, punta fina.', TRUE, 5, 5.50, cat_escritura_id, sub_rotuladores_id, '[]'),
    ('Rotulador Doble Punta', 'Versatilidad total', 'Una punta fina y otra tipo pincel, ideal para lettering.', TRUE, 5, 2.10, cat_escritura_id, sub_rotuladores_id, '[]'),
    ('Rotulador Fluorescente x4', 'Resalta lo importante', 'Pack con amarillo, rosa, verde y naranja.', TRUE, 4, 3.30, cat_escritura_id, sub_rotuladores_id, '[]'),
    ('Rotulador para Tela', 'Decora tus prendas', 'Tinta permanente resistente al lavado.', TRUE, 4, 2.90, cat_escritura_id, sub_rotuladores_id, '[]');

  -- Plumas estilográficas
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Pluma Estilográfica Clásica', 'Escribe con distinción', 'Incluye convertidor y tinta azul. Punta fina.', TRUE, 5, 9.80, cat_escritura_id, sub_plumas_id, '[]'),
    ('Pluma con Cuerpo Transparente', 'Diseño moderno y funcional', 'Punta media, compatible con cartuchos universales.', TRUE, 4, 5.60, cat_escritura_id, sub_plumas_id, '[]'),
    ('Pluma de Caligrafía Artística', 'Trazos expresivos y elegantes', 'Incluye tres puntas intercambiables y tinta negra.', TRUE, 5, 12.50, cat_escritura_id, sub_plumas_id, '[]'),
    ('Pluma Estilográfica de Lujo', 'Un regalo con clase', 'Cuerpo metálico grabado, estuche de presentación.', TRUE, 5, 18.00, cat_escritura_id, sub_plumas_id, '[]'),
    ('Pluma Escolar Económica', 'Ideal para aprender a escribir bien', 'Ligera, punta segura para estudiantes.', TRUE, 4, 2.40, cat_escritura_id, sub_plumas_id, '[]');

  -- IDs de categoría y subcategorías
  SELECT id INTO cat_carpetas_id
    FROM inventory_categories
   WHERE "fullName" = 'Carpetas y archivadores';

  SELECT id INTO sub_carpetas_plasticas_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Carpetas plásticas';

  SELECT id INTO sub_archivadores_metalicos_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Archivadores metálicos';

  SELECT id INTO sub_portadocumentos_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Portadocumentos';

  -- Carpetas plásticas
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Carpeta Plástica A4 con Broche', 'Protege tus documentos', 'Fabricada en polipropileno resistente, cierre de broche.', TRUE, 4, 1.50, cat_carpetas_id, sub_carpetas_plasticas_id, '[]'),
    ('Carpeta Escolar de Colores', 'Organiza con estilo', 'Pack de 3 carpetas en colores surtidos, tamaño carta.', TRUE, 4, 3.40, cat_carpetas_id, sub_carpetas_plasticas_id, '[]'),
    ('Carpeta Transparente con Botón', 'Todo a la vista', 'Diseño liviano y flexible con botón plástico.', TRUE, 5, 1.20, cat_carpetas_id, sub_carpetas_plasticas_id, '[]'),
    ('Carpeta de Presentación 20 Fundas', 'Ideal para proyectos y exposiciones', 'Incluye fundas plásticas internas removibles.', TRUE, 5, 4.90, cat_carpetas_id, sub_carpetas_plasticas_id, '[]'),
    ('Carpeta Lomo Ancho Plástica', 'Mayor capacidad', 'Con anillas internas y etiquetas para clasificación.', TRUE, 4, 2.60, cat_carpetas_id, sub_carpetas_plasticas_id, '[]');

  -- Archivadores metálicos
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Archivador Metálico de Palanca', 'Archivo seguro y duradero', 'Lomo de 7 cm, mecanismo de palanca reforzado.', TRUE, 5, 5.80, cat_carpetas_id, sub_archivadores_metalicos_id, '[]'),
    ('Archivador Tipo Caja con Cerradura', 'Privacidad y orden', 'Incluye cerradura con llave y asa lateral.', TRUE, 5, 9.50, cat_carpetas_id, sub_archivadores_metalicos_id, '[]'),
    ('Archivador Vertical para Escritorio', 'Optimiza el espacio', 'Diseño metálico con divisiones ajustables.', TRUE, 4, 6.20, cat_carpetas_id, sub_archivadores_metalicos_id, '[]'),
    ('Archivador Modular Apilable', 'Expande según tus necesidades', 'Unidades individuales que encajan entre sí.', TRUE, 4, 7.90, cat_carpetas_id, sub_archivadores_metalicos_id, '[]'),
    ('Archivador de Seguridad Ignífugo', 'Protección contra fuego', 'Certificado hasta 60 minutos, doble cerradura.', TRUE, 5, 42.00, cat_carpetas_id, sub_archivadores_metalicos_id, '[]');

  -- Portadocumentos
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Portadocumentos con Cierre Zipper', 'Práctico y seguro', 'Ideal para guardar papeles sueltos, tamaño oficio.', TRUE, 4, 2.10, cat_carpetas_id, sub_portadocumentos_id, '[]'),
    ('Portadocumentos Ejecutivo de Cuero Sintético', 'Presentación profesional', 'Incluye compartimientos internos y porta bolígrafo.', TRUE, 5, 12.80, cat_carpetas_id, sub_portadocumentos_id, '[]'),
    ('Portadocumentos Transparente con Broche', 'Todo visible de un vistazo', 'Ideal para estudiantes y oficinas.', TRUE, 4, 1.60, cat_carpetas_id, sub_portadocumentos_id, '[]'),
    ('Portadocumentos con Asas', 'Fácil de transportar', 'Diseño tipo maletín, ideal para entrevistas o trámites.', TRUE, 5, 6.70, cat_carpetas_id, sub_portadocumentos_id, '[]'),
    ('Portadocumentos con Separadores', 'Orden y acceso rápido', 'Incluye divisores por color y etiquetas.', TRUE, 4, 3.90, cat_carpetas_id, sub_portadocumentos_id, '[]');

  -- Obtener IDs
  SELECT id INTO cat_papel_blocs_id
    FROM inventory_categories
   WHERE "fullName" = 'Papel y blocs';

  SELECT id INTO sub_hojas_carta_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Hojas tamaño carta';

  SELECT id INTO sub_blocks_dibujo_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Blocks de dibujo';

  SELECT id INTO sub_bloc_notas_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Bloc de notas';

  -- Hojas tamaño carta
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Resma Papel Carta 75g', 'Para impresión y copias', '500 hojas blancas, calidad óptima para impresoras láser y tinta.', TRUE, 5, 13.50, cat_papel_blocs_id, sub_hojas_carta_id, '[]'),
    ('Papel Reciclado Carta', 'Ecológico y funcional', 'Paquete de 500 hojas, tono natural, ideal para uso interno.', TRUE, 4, 11.90, cat_papel_blocs_id, sub_hojas_carta_id, '[]'),
    ('Hojas Carta Rayadas x100', 'Escribe sin torcerte', 'Papel rayado para manuscritos, tamaño carta.', TRUE, 4, 3.20, cat_papel_blocs_id, sub_hojas_carta_id, '[]'),
    ('Papel Carta Perforado x200', 'Listo para archivar', 'Hojas pre-perforadas de alta calidad.', TRUE, 5, 7.80, cat_papel_blocs_id, sub_hojas_carta_id, '[]'),
    ('Hojas Carta Cuadro Grande', 'Ideal para matemáticas', '100 hojas impresas con cuadros de 1 cm.', TRUE, 4, 2.90, cat_papel_blocs_id, sub_hojas_carta_id, '[]');

  -- Blocks de dibujo
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Block de Dibujo Artístico A4', 'Explora tu creatividad', '50 hojas blancas gruesas, apto para lápiz, carbón y tinta.', TRUE, 5, 6.30, cat_papel_blocs_id, sub_blocks_dibujo_id, '[]'),
    ('Block Escolar de Dibujo', 'Ideal para tareas escolares', '30 hojas blancas lisas, tamaño carta.', TRUE, 4, 3.10, cat_papel_blocs_id, sub_blocks_dibujo_id, '[]'),
    ('Block de Papel Canson', 'Calidad profesional', 'Hojas texturizadas, especial para acuarela y gouache.', TRUE, 5, 9.80, cat_papel_blocs_id, sub_blocks_dibujo_id, '[]'),
    ('Block Dibujo con Espiral', 'Comodidad al girar páginas', '60 hojas, tapa dura, tamaño A4.', TRUE, 4, 5.50, cat_papel_blocs_id, sub_blocks_dibujo_id, '[]'),
    ('Block Sketchbook Portátil', 'Lleva tu arte a donde vayas', 'Tamaño A5, papel blanco marfil, ideal para bocetos.', TRUE, 5, 4.70, cat_papel_blocs_id, sub_blocks_dibujo_id, '[]');

  -- Bloc de notas
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Bloc de Notas Adhesivas 76x76mm', 'Notas rápidas en cualquier parte', '100 hojas adhesivas removibles.', TRUE, 5, 1.30, cat_papel_blocs_id, sub_bloc_notas_id, '[]'),
    ('Bloc de Notas Rayadas A6', 'Toma apuntes con orden', '50 hojas rayadas, ideal para escritorios y oficinas.', TRUE, 4, 2.10, cat_papel_blocs_id, sub_bloc_notas_id, '[]'),
    ('Bloc de Notas con Separadores', 'Organiza tus tareas por color', 'Incluye pestañas adhesivas de diferentes colores.', TRUE, 4, 3.60, cat_papel_blocs_id, sub_bloc_notas_id, '[]'),
    ('Bloc de Notas Reposicionables x3', 'Escribe, pega y vuelve a usar', 'Pack de 3 blocs de diferentes colores.', TRUE, 4, 2.90, cat_papel_blocs_id, sub_bloc_notas_id, '[]'),
    ('Bloc de Notas con Tapa Dura', 'Más resistente, más elegante', '100 hojas blancas, encuadernado profesional.', TRUE, 5, 4.40, cat_papel_blocs_id, sub_bloc_notas_id, '[]');

  -- Obtener IDs
  SELECT id INTO cat_adhesivos_id
    FROM inventory_categories
   WHERE "fullName" = 'Adhesivos y cintas';

  SELECT id INTO sub_cinta_transparente_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Cinta adhesiva transparente';

  SELECT id INTO sub_pegamento_barra_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Pegamento en barra';

  SELECT id INTO sub_cinta_doble_cara_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Cinta de doble cara';

  -- Cinta adhesiva transparente
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Cinta Transparente 18mm x 30m', 'Invisible y resistente', 'Ideal para uso escolar y de oficina.', TRUE, 5, 1.10, cat_adhesivos_id, sub_cinta_transparente_id, '[]'),
    ('Cinta Adhesiva Grande 48mm x 100m', 'Para embalar sin preocupaciones', 'Alta resistencia, uso industrial o doméstico.', TRUE, 4, 3.90, cat_adhesivos_id, sub_cinta_transparente_id, '[]'),
    ('Cinta Mágica Reposicionable', 'No deja marcas', 'Despega y pega sin dañar el papel, acabado mate.', TRUE, 5, 2.50, cat_adhesivos_id, sub_cinta_transparente_id, '[]'),
    ('Cinta Doble Rollo Escolar', 'Pack económico', 'Dos rollos de cinta para manualidades y tareas.', TRUE, 4, 1.80, cat_adhesivos_id, sub_cinta_transparente_id, '[]'),
    ('Dispensador de Cinta + Rollo', 'Todo en uno', 'Corte limpio con base pesada antideslizante.', TRUE, 5, 5.20, cat_adhesivos_id, sub_cinta_transparente_id, '[]');

  -- Pegamento en barra
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Pegamento en Barra Escolar 10g', 'No tóxico, fácil de usar', 'Ideal para papel, cartulina y fotos.', TRUE, 5, 0.95, cat_adhesivos_id, sub_pegamento_barra_id, '[]'),
    ('Pegamento en Barra 20g Secado Rápido', 'Firme en segundos', 'Alta adhesión y durabilidad.', TRUE, 4, 1.30, cat_adhesivos_id, sub_pegamento_barra_id, '[]'),
    ('Pack x3 Pegamento en Barra', 'Más por menos', 'Tres unidades de 10g cada una.', TRUE, 4, 2.40, cat_adhesivos_id, sub_pegamento_barra_id, '[]'),
    ('Pegamento Barra Púrpura', 'Se ve al aplicar, desaparece al secar', 'Perfecto para niños y manualidades.', TRUE, 5, 1.50, cat_adhesivos_id, sub_pegamento_barra_id, '[]'),
    ('Pegamento Reposicionable', 'Corrige antes de fijar', 'Permite ajustar antes del secado completo.', TRUE, 4, 1.75, cat_adhesivos_id, sub_pegamento_barra_id, '[]');

  -- Cinta de doble cara
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Cinta Doble Cara 12mm x 10m', 'Adhesión limpia y precisa', 'Perfecta para papel, cartulina y fotos.', TRUE, 5, 2.10, cat_adhesivos_id, sub_cinta_doble_cara_id, '[]'),
    ('Cinta Doble Cara Espuma 18mm', 'Fija objetos livianos en la pared', 'Con base de espuma, gran agarre.', TRUE, 4, 3.60, cat_adhesivos_id, sub_cinta_doble_cara_id, '[]'),
    ('Cinta Montaje Transparente', 'Invisible y potente', 'Ideal para vidrio o superficies lisas.', TRUE, 5, 4.20, cat_adhesivos_id, sub_cinta_doble_cara_id, '[]'),
    ('Cinta Scrapbooking Ácida Free', 'Especial para álbumes y arte', 'Libre de ácidos, no daña papel fotográfico.', TRUE, 5, 2.90, cat_adhesivos_id, sub_cinta_doble_cara_id, '[]'),
    ('Cinta Doble Cara Industrial', 'Alta resistencia', 'Uso pesado, soporta hasta 5 kg por metro.', TRUE, 5, 6.80, cat_adhesivos_id, sub_cinta_doble_cara_id, '[]');

  -- Obtener IDs
  SELECT id INTO cat_manualidades_id
    FROM inventory_categories
   WHERE "fullName" = 'Manualidades y arte';

  SELECT id INTO sub_pinturas_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Pinturas acrílicas';

  SELECT id INTO sub_pinceles_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Pinceles artísticos';

  SELECT id INTO sub_cartulinas_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Cartulinas';

  -- Pinturas acrílicas
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Set Pinturas Acrílicas x12 Colores', 'Crea sin límites', 'Colores vibrantes, secado rápido, ideales para tela y cartón.', TRUE, 5, 6.80, cat_manualidades_id, sub_pinturas_id, '[]'),
    ('Pintura Acrílica Blanca 120ml', 'Base o retoques con buen acabado', 'Alta cobertura, acabado mate.', TRUE, 4, 1.90, cat_manualidades_id, sub_pinturas_id, '[]'),
    ('Pintura Acrílica Negra Profesional', 'Contraste perfecto', 'Ideal para detalles finos o fondo oscuro.', TRUE, 5, 2.10, cat_manualidades_id, sub_pinturas_id, '[]'),
    ('Set Acrílicos Metálicos', 'Brilla tu creatividad', '6 colores metalizados para efectos especiales.', TRUE, 5, 5.70, cat_manualidades_id, sub_pinturas_id, '[]'),
    ('Pintura Acrílica Neon x6', 'Colores que resaltan', 'Pack de 6 tonos fluorescentes intensos.', TRUE, 4, 6.30, cat_manualidades_id, sub_pinturas_id, '[]');

  -- Pinceles artísticos
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Set Pinceles Básicos x6', 'Todo lo que necesitas para empezar', 'Incluye pinceles planos y redondos, mango de madera.', TRUE, 5, 3.90, cat_manualidades_id, sub_pinceles_id, '[]'),
    ('Pincel de Detalle 0/5', 'Precisión extrema', 'Ideal para miniaturas, letras o detalles.', TRUE, 5, 1.80, cat_manualidades_id, sub_pinceles_id, '[]'),
    ('Pincel Angular para Sombreado', 'Versatilidad en cada trazo', 'Cerdas suaves y resistentes, punta inclinada.', TRUE, 4, 2.50, cat_manualidades_id, sub_pinceles_id, '[]'),
    ('Set Pinceles Profesionales x10', 'Calidad para artistas exigentes', 'Incluye estuche enrollable y variedad de formas.', TRUE, 5, 8.90, cat_manualidades_id, sub_pinceles_id, '[]'),
    ('Pincel para Acuarela Sintético', 'Absorción y flexibilidad', 'Ideal para lavados amplios y degradados.', TRUE, 4, 2.30, cat_manualidades_id, sub_pinceles_id, '[]');

  -- Cartulinas
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Cartulina Blanca Tamaño Carta x10', 'Base perfecta para tus ideas', 'Cartulina de 180g, lisa y uniforme.', TRUE, 4, 1.50, cat_manualidades_id, sub_cartulinas_id, '[]'),
    ('Pack Cartulinas de Colores x12', 'Dale vida a tus proyectos', 'Colores surtidos, tamaño carta.', TRUE, 5, 2.80, cat_manualidades_id, sub_cartulinas_id, '[]'),
    ('Cartulina Negra Premium', 'Fondo elegante y profesional', 'Perfecta para contrastes y presentaciones.', TRUE, 5, 0.80, cat_manualidades_id, sub_cartulinas_id, '[]'),
    ('Cartulina Texturizada A4', 'Más carácter en tu presentación', 'Superficie rugosa, ideal para invitaciones.', TRUE, 4, 1.20, cat_manualidades_id, sub_cartulinas_id, '[]'),
    ('Cartulina Fluorescente x5', 'Colores que destacan', 'Alta visibilidad, ideal para señalización o manualidades escolares.', TRUE, 4, 2.10, cat_manualidades_id, sub_cartulinas_id, '[]');

  -- Obtener IDs
  SELECT id INTO cat_tecnologia_id
    FROM inventory_categories
   WHERE "fullName" = 'Tecnología y electrónica';

  SELECT id INTO sub_calculadoras_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Calculadoras científicas';

  SELECT id INTO sub_memorias_usb_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Memorias USB';

  SELECT id INTO sub_tabletas_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Tabletas gráficas';

  -- Calculadoras científicas
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Calculadora Científica 240 Funciones', 'Potencia para estudiantes y profesionales', 'Pantalla de dos líneas, resolución de ecuaciones, trigonometría.', TRUE, 5, 12.90, cat_tecnologia_id, sub_calculadoras_id, '[]'),
    ('Calculadora Solar Básica', 'Sin pilas, siempre lista', 'Panel solar integrado, funciones esenciales.', TRUE, 4, 5.30, cat_tecnologia_id, sub_calculadoras_id, '[]'),
    ('Calculadora Gráfica Programable', 'Ideal para universidad', 'Pantalla gráfica, memoria programable, estadísticas avanzadas.', TRUE, 5, 64.00, cat_tecnologia_id, sub_calculadoras_id, '[]'),
    ('Mini Calculadora de Bolsillo', 'Compacta y funcional', '8 dígitos, batería de larga duración.', TRUE, 4, 3.80, cat_tecnologia_id, sub_calculadoras_id, '[]'),
    ('Calculadora Científica Retroiluminada', 'Visibilidad total', 'Pantalla LCD retroiluminada, ideal para condiciones de baja luz.', TRUE, 5, 15.20, cat_tecnologia_id, sub_calculadoras_id, '[]');

  -- Memorias USB
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Memoria USB 16GB 3.0', 'Rápida y confiable', 'Velocidades de transferencia hasta 100 MB/s.', TRUE, 5, 7.90, cat_tecnologia_id, sub_memorias_usb_id, '[]'),
    ('USB 32GB con Llavero', 'Siempre contigo', 'Diseño compacto y resistente con aro metálico.', TRUE, 4, 9.50, cat_tecnologia_id, sub_memorias_usb_id, '[]'),
    ('Memoria USB 64GB Ultra Rápida', 'Gran capacidad, máxima velocidad', 'Interfaz USB 3.2 Gen1, hasta 130 MB/s.', TRUE, 5, 14.20, cat_tecnologia_id, sub_memorias_usb_id, '[]'),
    ('USB 8GB Económica', 'Lo esencial para tus documentos', 'Ideal para tareas escolares y trabajo de oficina.', TRUE, 3, 4.10, cat_tecnologia_id, sub_memorias_usb_id, '[]'),
    ('USB 128GB Dual Type-A / Type-C', 'Compatibilidad total', 'Conector doble, compatible con PC y smartphones.', TRUE, 5, 22.80, cat_tecnologia_id, sub_memorias_usb_id, '[]');

  -- Tabletas gráficas
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Tableta Gráfica Digital 6x4"', 'Dibuja con libertad', 'Área activa de 6x4 pulgadas, 8192 niveles de presión.', TRUE, 5, 39.90, cat_tecnologia_id, sub_tabletas_id, '[]'),
    ('Tableta Gráfica con Pantalla 11.6"', 'Lo que dibujas es lo que ves', 'Pantalla HD, compatible con Windows y Mac.', TRUE, 5, 168.00, cat_tecnologia_id, sub_tabletas_id, '[]'),
    ('Tableta Bluetooth Recargable', 'Sin cables, más control', 'Batería de larga duración, conexión inalámbrica.', TRUE, 4, 55.00, cat_tecnologia_id, sub_tabletas_id, '[]'),
    ('Mini Tableta para Firmas', 'Ideal para negocios', 'Pequeña y precisa, conectividad USB.', TRUE, 4, 29.90, cat_tecnologia_id, sub_tabletas_id, '[]'),
    ('Tableta Gráfica Profesional 13"', 'Herramienta para artistas', 'Alta resolución, lápiz sin batería, botones programables.', TRUE, 5, 210.00, cat_tecnologia_id, sub_tabletas_id, '[]');

  -- Obtener IDs
  SELECT id INTO cat_impresion_id
    FROM inventory_categories
   WHERE "fullName" = 'Suministros de impresión';

  SELECT id INTO sub_toner_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Tóner para impresoras';

  SELECT id INTO sub_cartuchos_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Cartuchos de tinta';

  SELECT id INTO sub_papel_foto_id
    FROM inventory_subcategories
   WHERE "fullName" = 'Papel fotográfico';

  -- Tóner para impresoras
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Tóner Negro Universal 12A', 'Rendimiento confiable', 'Compatible con múltiples modelos HP y Canon.', TRUE, 5, 22.90, cat_impresion_id, sub_toner_id, '[]'),
    ('Tóner Color Cyan 305A', 'Color vibrante sin manchas', 'Para impresoras HP Color LaserJet.', TRUE, 5, 45.00, cat_impresion_id, sub_toner_id, '[]'),
    ('Tóner Compatible Brother TN-660', 'Calidad a menor costo', 'Rinde hasta 2.600 páginas.', TRUE, 4, 28.50, cat_impresion_id, sub_toner_id, '[]'),
    ('Tóner Láser Samsung MLT-D111S', 'Fácil instalación', 'Diseñado para resultados nítidos y duraderos.', TRUE, 4, 31.00, cat_impresion_id, sub_toner_id, '[]'),
    ('Pack Tóner CMYK Genérico', 'Completa tu stock de color', 'Incluye negro, cian, magenta y amarillo.', TRUE, 5, 82.00, cat_impresion_id, sub_toner_id, '[]');

  -- Cartuchos de tinta
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Cartucho Negro HP 664XL', 'Imprime más por menos', 'Hasta 480 páginas con alta calidad.', TRUE, 5, 18.90, cat_impresion_id, sub_cartuchos_id, '[]'),
    ('Cartucho Color Tricolor 662', 'Colores brillantes y duraderos', 'Compatible con impresoras HP DeskJet.', TRUE, 4, 21.00, cat_impresion_id, sub_cartuchos_id, '[]'),
    ('Cartucho Epson T544 EcoTank', 'Relleno económico', 'Botella de tinta negra para impresoras EcoTank.', TRUE, 5, 11.50, cat_impresion_id, sub_cartuchos_id, '[]'),
    ('Cartucho Canon CL-146 Color', 'Nitidez y fidelidad de color', 'Tinta a base de pigmentos, secado rápido.', TRUE, 5, 23.40, cat_impresion_id, sub_cartuchos_id, '[]'),
    ('Cartucho HP 954XL Magenta', 'Rinde más sin sacrificar calidad', 'Hasta 1600 páginas en color magenta.', TRUE, 4, 34.00, cat_impresion_id, sub_cartuchos_id, '[]');

  -- Papel fotográfico
  INSERT INTO inventory_product
    (full_name, slogan, description, is_active, rating, price, category_id, subcategory_id, images)
  VALUES
    ('Papel Fotográfico Brillante A4 x20', 'Fotos con calidad de laboratorio', 'Acabado glossy, compatible con tinta y láser.', TRUE, 5, 6.50, cat_impresion_id, sub_papel_foto_id, '[]'),
    ('Papel Mate A4 x50', 'Ideal para presentaciones y gráficos', 'Absorbe bien la tinta, acabado profesional.', TRUE, 4, 8.90, cat_impresion_id, sub_papel_foto_id, '[]'),
    ('Papel Fotográfico Adhesivo', 'Imprime y pega', 'Perfecto para stickers, etiquetas o scrapbooking.', TRUE, 5, 9.20, cat_impresion_id, sub_papel_foto_id, '[]'),
    ('Papel Glossy 10x15cm x100', 'Tamaño postal, brillo intenso', 'Secado rápido, resistente a manchas.', TRUE, 5, 10.80, cat_impresion_id, sub_papel_foto_id, '[]'),
    ('Papel Fotográfico Satinado', 'Balance entre brillo y textura', 'Acabado elegante para retratos o arte digital.', TRUE, 5, 7.40, cat_impresion_id, sub_papel_foto_id, '[]');


END
$$;

COMMIT;
