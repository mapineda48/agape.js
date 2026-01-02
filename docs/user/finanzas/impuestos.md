# Gestión de Impuestos

Agape.js cuenta con un motor de impuestos flexible que permite adaptarse a las normativas de diferentes regiones.

## Elementos del Sistema

### 1. Impuestos Individuales
Representan una tasa específica (ej: IVA 19%, Retención 2.5%). Cada impuesto tiene un código único y una tarifa porcentual.

### 2. Grupos de Impuestos
Permiten agrupar varios impuestos bajo un mismo nombre para facilitar la asignación a productos. Por ejemplo, un grupo "Gravado + Consumo" podría incluir tanto el IVA como el Impuesto al Consumo.

## Reglas de Protección (UC-9)

Para garantizar la integridad contable, el sistema impone las siguientes restricciones:
*   **No Deshabilitar en Uso:** No se puede desactivar un impuesto o grupo si existen productos activos que lo utilicen o facturas pendientes que dependan de él.
*   **Composición Obligatoria:** Un grupo de impuestos debe tener al menos un impuesto asociado para ser válido.
*   **Consistencia en Facturación:** Si un impuesto se utilizó en una factura ya emitida, su configuración histórica se preserva para evitar que cambios futuros alteren documentos ya cerrados.

## Automatización
Al seleccionar un producto en una venta o compra, el sistema identifica automáticamente su grupo de impuestos y calcula los valores correspondientes, minimizando el error humano.
