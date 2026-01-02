# Entradas y Salidas (Movimientos)

El sistema registra cada cambio en las existencias a través de "Movimientos de Inventario". Cada movimiento pasa por un flujo de estados para garantizar la validez de la información.

## Estados de un Movimiento

1.  **Borrador (Draft):** El documento está siendo preparado. Se puede editar, agregar o quitar productos. **No afecta el stock.**
2.  **Posteado (Posted):** El movimiento ha sido oficializado. En este momento el sistema actualiza las existencias y genera las capas de costo. **No se puede editar.**
3.  **Cancelado (Cancelled):** Si un movimiento posteado fue un error, debe cancelarse. El sistema generará automáticamente un "Movimiento de Reversión" para devolver el stock a su estado anterior.

## Reglas de Operación

*   **Fechas Futuras:** El sistema prohíbe registrar movimientos con fecha posterior al día de hoy.
*   **Cantidades:** Todas las cantidades en un movimiento deben ser mayores a cero.
*   **Disponibilidad (ATP):** Al realizar una salida, el sistema verifica que exista stock suficiente disponible (Existencias menos Reservas). Si no hay saldo, la operación será rechazada.
*   **Conversión Automática:** Si registra un movimiento en una unidad de medida diferente a la base (ej: registra en "Caja" cuando la base es "Unidad"), el sistema aplicará automáticamente el factor de conversión configurado.

## Tipos de Movimientos Comunes
*   **Entrada por Compra:** Incrementa el stock y crea una nueva capa de costo para el cálculo del valor del inventario.
*   **Salida por Venta:** Disminuye el stock y consume las capas de costo más antiguas (FIFO).
*   **Ajustes de Inventario:** Utilizados para corregir diferencias encontradas en conteos físicos.
