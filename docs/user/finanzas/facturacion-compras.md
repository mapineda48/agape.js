# Facturación de Compras (Cuentas por Pagar)

Agape.js permite registrar las facturas recibidas de proveedores para controlar los pagos y asegurar que los costos registrados coincidan con lo pactado.

## Registro y Validación (Match)

El sistema implementa controles estrictos para evitar pagos erróneos:

*   **Validación de Precio (R6):** Al registrar una factura basada en una recepción de almacén, el sistema alerta o impide el registro si el precio cobrado por el proveedor varía significativamente (tolerancia configurable, ej: >5%) respecto al precio de la orden de compra.
*   **Validación de Cantidad (R7):** No se permite facturar una cantidad superior a la recibida físicamente en el almacén.
*   **Doble Validación:** Para mayor seguridad, el sistema cruza la Orden de Compra + Recepción de Mercancía + Factura del Proveedor (Three-way match).

## Vencimientos Automáticos (R8)

El sistema calcula la **Fecha de Vencimiento** de forma automática:
*   Si se indica el término de pago (ej: 30 días), el sistema suma esos días a la fecha de emisión de la factura.
*   Permite la sobrescritura manual si el proveedor otorga un plazo especial para un documento específico.

## Estados del Documento
Las facturas de compra afectan directamente el módulo de Tesorería, apareciendo como obligaciones pendientes de pago hasta que se registre el egreso correspondiente.
