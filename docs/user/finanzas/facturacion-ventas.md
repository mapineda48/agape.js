# Facturación de Ventas

La Factura de Venta es el documento legal que formaliza la entrega de productos o servicios y establece el derecho de cobro al cliente.

## Ciclo de la Factura

1.  **Borrador (Draft):** La factura se está preparando. Permite editar cantidades, precios, impuestos y descuentos. En este estado no afecta la cartera del cliente.
2.  **Posteada/Emitida (Issued):** El documento se finaliza. El sistema bloquea cambios, genera el número consecutivo legal y suma el valor al saldo pendiente del cliente.
3.  **Pagada (Paid):** El saldo de la factura ha sido cubierto totalmente mediante uno o más recaudos.
4.  **Cancelada (Cancelled):** La factura ha sido anulada. Este estado solo es permitido bajo ciertas condiciones legales y revierte el efecto en cartera.

## Reglas de Negocio y Totales

*   **Integración con Pedidos:** Una factura puede nacer de un pedido de venta, heredando automáticamente sus líneas y condiciones.
*   **Prendas de Impuestos:** Los impuestos se calculan línea por línea basándose en el grupo tributario del producto.
*   **Descuentos:** Permite aplicar descuentos específicos por ítem y un descuento global sobre el total antes de impuestos.
*   **Inmutabilidad:** Una vez emitida (Issued), la factura no puede ser modificada. Cualquier corrección debe realizarse mediante un proceso de anulación o nota crédito.

## Control de Cartera
El sistema monitorea en tiempo real:
*   **Saldo Pendiente:** Total de la factura menos pagos aplicados.
*   **Vencimiento:** Días restantes para el pago basado en la condición comercial (ej: 30 días).
*   **Estado de Mora:** Alerta automática si la fecha de vencimiento ha sido superada.
