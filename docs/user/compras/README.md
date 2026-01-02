# Compras y Proveedores

El módulo de Compras de Agape.js permite gestionar el abastecimiento de la empresa, desde la homologación de proveedores hasta la recepción física de mercancía y su posterior facturación.

## Secciones del Módulo

### [Registro de Proveedores](./proveedores.md)
Centralice la información de sus aliados estratégicos, incluyendo datos legales, comerciales y tipos de servicio.

### [Órdenes de Compra](./ordenes-compra.md)
Gestió los pedidos formales a sus proveedores, controlando precios pactados y cantidades solicitadas.

### [Recepción de Mercancía (Entradas)](./recepcion.md)
Registro del ingreso físico de los productos al almacén, asegurando que coincidan con lo solicitado en las órdenes de compra.

---

## Integración con otros Módulos
*   **Inventarios:** Cada recepción de compra alimenta el stock y genera una capa de costo para el cálculo del valor del inventario.
*   **Finanzas:** La recepción de mercancía dispara automáticamente la creación de la factura de compra (cuenta por pagar), asegurando la consistencia contable.
*   **Configuración:** Utiliza las series de numeración y unidades de medida configuradas globalmente.
