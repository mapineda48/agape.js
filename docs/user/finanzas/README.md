# Finanzas y Facturación

El módulo de Finanzas de Agape.js integra los flujos operativos de compras y ventas con la gestión contable, asegurando un control preciso de la cartera, las obligaciones y los impuestos.

## Secciones del Módulo

### [Facturación de Ventas](./facturacion-ventas.md)
Gestió el ciclo de cobro a clientes, desde la creación de borradores hasta el posteo definitivo (asiento contable).

### [Facturación de Compras](./facturacion-compras.md)
Control de las cuentas por pagar a proveedores, con validación de precios y cantidades vs. recepciones de almacén.

### [Tesorería (Pagos y Recaudos)](./tesoreria.md)
Registro de ingresos y egresos de dinero, y su aplicación a las facturas pendientes.

### [Gestión de Impuestos](./impuestos.md)
Configuración de tasas (IVA, Retenciones) y grupos tributarios aplicables a productos y servicios.

### [Multimoneda](./monedas.md)
Administre múltiples divisas y sus tasas de cambio, manteniendo siempre una moneda base para reportes.

---

## Conceptos Clave
*   **Posteo (Posting):** Proceso de finalizar un documento. Una vez posteado, los totales se calculan, el documento se vuelve inmutable y afecta los estados financieros.
*   **Asignación (Allocation):** Acto de vincular un pago con una o varias facturas específicas para reducir su saldo pendiente.
*   **Vencimiento automático:** El sistema calcula las fechas de pago basado en los términos comerciales pactados con el tercero.
