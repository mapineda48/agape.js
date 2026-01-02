# Series de Numeración

El sistema permite gestionar múltiples consecutivos para un mismo tipo de documento mediante el uso de "Series". Esto es útil para separar la numeración por sucursales, puntos de venta o resoluciones de facturación.

## Elementos de una Serie

*   **Código de Serie:** Identificador único para la serie (ej: `FAC-MED`).
*   **Prefijo:** Texto que antecede al número (ej: `FAC-`).
*   **Rango Numérico:** Definición del número inicial y final (ej: del 1 al 10,000).
*   **Consecutivo Actual:** El último número utilizado por el sistema. No se puede navegar hacia atrás.
*   **Vigencia:** Fechas de inicio y fin entre las cuales la serie es válida para su uso.
*   **Serie por Defecto:** Indica cuál serie se seleccionará automáticamente al crear un nuevo documento de ese tipo. Solo puede haber una serie por defecto por cada tipo de documento.

## Reglas de Negocio

1.  **Consistencia de Rango:** El número inicial no puede ser mayor que el número final.
2.  **Consistencia de Fechas:** La fecha de inicio de vigencia debe ser anterior a la fecha de fin (si aplica).
3.  **Numeración Automática:** El sistema asignará el siguiente número disponible al momento de guardar (contabilizar) el documento.
4.  **Validación de Vigencia:** Al intentar crear un documento, el sistema verificará que la fecha actual esté dentro del rango de vigencia de la serie seleccionada.

## Configuración de Resoluciones de Facturación
Para las Facturas de Venta, asegúrese de configurar el prefijo y los rangos exactamente como aparecen en la resolución autorizada por la entidad tributaria.
