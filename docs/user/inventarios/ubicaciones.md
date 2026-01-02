# Almacenes y Ubicaciones

Las ubicaciones representan los puntos físicos de almacenamiento de la mercancía.

## Configuración

*   **Código de Ubicación:** Breve identificador (ej: `BOD-01`, `RECEP-01`).
*   **Nombre Full:** Descripción detallada del lugar.
*   **Estado:** Permite habilitar o deshabilitar ubicaciones para la operación.

## Importancia en los Movimientos
Todo movimiento de inventario debe especificar una ubicación de origen o destino. El sistema controla el stock de forma independiente para cada una, permitiendo conocer exactamente dónde se encuentra cada unidad de producto.

> **Nota:** Se recomienda definir una estructura de ubicaciones que refleje fielmente la organización física de su almacén para facilitar los procesos de alistamiento (picking) y conteo cíclico.
