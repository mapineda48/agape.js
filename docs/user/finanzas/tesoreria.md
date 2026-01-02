# Tesorería (Pagos y Recaudos)

El módulo de Tesorería gestiona el movimiento de dinero hacia y desde su empresa, permitiendo un control detallado del flujo de caja.

## Tipos de Transacciones

1.  **Recaudos (Sales Receipts):** Ingresos de dinero provenientes de clientes.
2.  **Pagos/Egresos (Purchase Disbursements):** Salidas de dinero para pagar a proveedores o gastos internos.

## El Proceso de Asignación (Allocation)

Un pago en Agape.js puede estar en dos estados:
*   **Registrado (Draft):** El dinero ha ingresado/salido pero no se ha vinculado a ninguna factura. Se mantiene como un "saldo a favor" o "anticipo".
*   **Aplicado (Posted):** El monto ha sido distribuido entre una o varias facturas pendientes.

### Reglas de Aplicación:
*   **Multi-Factura:** Un solo pago puede cubrir múltiples facturas (ej: un cheque que paga 3 facturas diferentes).
*   **Pago Parcial:** Si el monto del pago es inferior al saldo de la factura, esta queda en estado "Pago Parcial".
*   **Saldos a Favor:** Si sobra dinero después de pagar las facturas, el remanente queda como "No Asignado" para ser usado en facturas futuras.

## Medios de Pago
El sistema soporta diversos métodos (Efectivo, Transferencia, Cheque, Tarjeta), permitiendo la conciliación posterior con los extractos bancarios.
