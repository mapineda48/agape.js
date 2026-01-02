# Gestión de Productos (Items)

En Agape.js, el catálogo de ítems es el corazón de la operación. Clasificamos los ítems en dos grandes categorías para optimizar su manejo.

## Tipos de Ítems

1.  **Bienes (Goods):** Productos físicos que ocupan espacio en un almacén y tienen control de stock. Solo estos pueden generar movimientos de inventario.
2.  **Servicios (Services):** Actividades o conceptos no físicos que se facturan pero no tienen existencia en almacén.

## Configuración de Inventario

Para que un ítem sea gestionado correctamente en el inventario, debe considerarse:

*   **Unidad de Medida Base:** La unidad mínima en la que se controla el stock (ej: Unidad, Metro, Litro).
*   **Control de Lotes:** Se define si el producto requiere obligatoriamente un número de lote para cada movimiento. Esto es común en industrias reguladas (alimentos, medicinas).
*   **Jerarquía y Categorías:** Organización lógica de los productos para facilitar su búsqueda y reporteo.

## Reglas de Dominio
*   **Validación de Tipo:** El sistema impedirá realizar movimientos de inventario (entradas/salidas) sobre ítems marcados como "Servicios".
*   **Código de Producto:** Cada ítem debe tener un código único para su identificación en toda la plataforma.
