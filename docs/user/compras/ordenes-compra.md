# Órdenes de Compra

La Orden de Compra (OC) es el documento formal que autoriza a un proveedor a suministrar productos o servicios bajo condiciones específicas de precio y cantidad.

## Ciclo de Vida de la Orden

1.  **Pendiente (Pending):** La orden ha sido creada pero aún no ha sido aprobada formalmente. En este estado es editable.
2.  **Aprobada (Approved):** La orden cuenta con el visto bueno para ser enviada al proveedor. Ya puede ser recibida en el almacén.
3.  **Recibida (Received):** Se ha registrado el ingreso total de la mercancía asociada a esta orden. En este punto la orden se considera cerrada.
4.  **Cancelada (Cancelled):** La orden ha sido anulada y no genera compromiso operacional ni financiero.

## Reglas de Negocio

*   **Proveedor Activo:** Solo se pueden emitir órdenes a proveedores que estén marcados como "Activos".
*   **Consistencia de Ítems:** Cada ítem en la orden debe estar habilitado en el catálogo maestro y tener cantidades y precios mayores a cero.
*   **Numeración Fiscal:** Cada orden recibe un número único automático basado en la serie configurada.
*   **Fecha de Orden:** El sistema registra la fecha de emisión para control de tiempos de entrega.

## Flujo de Aprobación
Una vez la orden pasa a estado "Aprobado", el sistema bloquea ediciones adicionales para garantizar que lo recibido en el almacén coincida exactamente con lo contratado.
