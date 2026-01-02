# Recepción de Mercancía (Entradas)

El registro de recepción (Goods Receipt) es el punto de control donde se confirma el ingreso físico de los productos al almacén.

## Proceso de Recepción

Existen dos formas de registrar una entrada:
1.  **Con Referencia a Orden de Compra:** Se seleccionan los ítems de una OC aprobada. El sistema arrastra automáticamente los precios y cantidades pendientes.
2.  **Entrada Directa:** Recepción de mercancía sin un documento previo de pedido (ajustes o compras de emergencia).

## Reglas de Control (Anti-Fraude y Error)

*   **Inmutabilidad (R1):** Una vez que una recepción ha sido "Posteada", no puede ser editada. Si hubo un error, debe anularse y crearse una nueva.
*   **Validación de Cantidades (R3 - Overage):** El sistema impide recibir más mercancía de la que fue solicitada originalmente en la Orden de Compra.
*   **Cierre Automático de OC (R4):** Cuando la suma de las recepciones iguala o supera lo ordenado, el sistema marca automáticamente la Orden de Compra como "Recibida" (Cerrada).

## Automatización Contable e Inventario

*   **Efecto en Stock:** Al postear la recepción, el sistema incrementa el saldo en la ubicación seleccionada y actualiza el costo promedio/FIFO del artículo.
*   **Facturación Automática:** Al finalizar la recepción, Agape.js genera automáticamente una **Factura de Compra** en borrador con los mismos precios y cantidades, lista para ser revisada por el departamento contable.

> **Nota:** Se recomienda realizar la recepción en tiempo real al descargar el camión para mantener el stock del sistema siempre sincronizado con la realidad física.
