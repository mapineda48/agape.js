# Pedidos de Venta

El pedido de venta representa el compromiso comercial con el cliente. Es el documento base que dispara los procesos de reserva de inventario y posterior facturación.

## Ciclo de Vida del Pedido

Un pedido transita por diversos estados que reflejan su avance operativo:

1.  **Pendiente (Pending):** Estado inicial del pedido. Puede ser editado o cancelado.
2.  **Confirmado (Confirmed):** La venta ha sido aprobada. En este punto se suele proceder al alistamiento de la mercancía.
3.  **Enviado (Shipped):** La mercancía ha salido del almacén hacia el cliente.
4.  **Entregado (Delivered):** El cliente ha recibido satisfactoriamente los productos. Este es un estado final.
5.  **Cancelado (Cancelled):** El pedido ha sido anulado. No genera más acciones y el inventario reservado se libera.

## Características del Pedido

*   **Numeración Automática:** Cada pedido recibe un número único basado en la serie de numeración configurada (ej: `PV-1001`).
*   **Cálculo de Totales:** El sistema calcula de forma precisa el subtotal, impuestos y el total general basado en los precios y descuentos por línea.
*   **Seguimiento de Progreso:** Puede monitorear visualmente qué porcentaje del pedido ha sido ya despachado y qué porcentaje ha sido facturado.

## Reglas de Negocio

*   **Cliente Activo:** Solo se pueden crear pedidos para clientes que estén en estado "Activo".
*   **Líneas de Detalle:** Todo pedido debe tener al menos un producto o servicio registrado.
*   **Transiciones de Estado:** El sistema controla el flujo lógico (ej: no se puede marcar como "Entregado" un pedido que no ha sido "Confirmado").
*   **Integración de Costos:** Al momento de la venta, el sistema utiliza el método FIFO para descargar el inventario, asegurando que el costo de venta refleje la entrada más antigua disponible.
