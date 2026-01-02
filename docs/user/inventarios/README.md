# Gestión de Inventarios

El módulo de Inventarios es el motor central de Agape.js para el control de bienes físicos. Permite administrar desde el catálogo de productos hasta el control detallado de existencias por almacén y lote.

## Secciones del Módulo

### [Gestión de Productos (Items)](./productos.md)
Administración del catálogo maestro de artículos, definiendo cuáles son inventariables y sus características base.

### [Almacenes y Ubicaciones](./ubicaciones.md)
Definición de los espacios físicos donde se resguarda la mercancía.

### [Entradas y Salidas (Movimientos)](./movimientos.md)
Registro y control de todos los flujos de mercancía (compras, ventas, traslados, ajustes).

### [Control de Lotes](./lotes.md)
Seguimiento detallado por números de lote, fechas de vencimiento y estados de disponibilidad (cuarentena, bloqueado, etc.).

### [Saldos y Stock](./stock.md)
Consulta de existencias en tiempo real, cantidades reservadas y disponibilidad neta.

---

## Conceptos Clave
*   **Item vs Producto:** En Agape.js, un "Item" es la definición genérica en el catálogo, mientras que un "Producto" (Good) es un ítem que tiene existencia física y control de stock.
*   **Disponibilidad (ATP):** El sistema calcula la cantidad que realmente puede ser utilizada (Existencia física - Reservas).
*   **Integridad de Costos:** Cada entrada de mercancía genera una "capa de costo" que el sistema consume automáticamente bajo el método FIFO (Primero en entrar, primero en salir) al realizar salidas.
