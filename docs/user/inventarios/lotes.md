# Control de Lotes

El control de lotes permite una trazabilidad total de la mercancía, desde su ingreso hasta su despacho final.

## Atributos del Lote

*   **Número de Lote:** Identificador único (alfanumérico).
*   **Fecha de Fabricación:** Útil para seguimiento de calidad.
*   **Fecha de Vencimiento:** Crítica para productos perecederos.
*   **Estado del Lote:**
    *   **ACTIVE:** Disponible para uso normal.
    *   **QUARANTINE / BLOCKED:** El stock existe físicamente pero el sistema **bloquea su salida** (ej: por pruebas de laboratorio o defectos detectados).

## Reglas de Validación

1.  **Lote Obligatorio:** Si un producto está configurado para requerir lote, el sistema no permitirá guardar ningún movimiento (entrada o salida) sin especificarlo.
2.  **Bloqueo por Vencimiento:** Por defecto, el sistema impide realizar salidas de lotes cuya fecha de vencimiento sea menor a la fecha actual.
3.  **Bloqueo por Estado:** Lotes en estado "Cuarentena" o "Bloqueado" no pueden ser seleccionados para ventas o consumos hasta que su estado cambie a "Activo".

## Trazabilidad
Al consultar un lote, el sistema permite rastrear el documento origen (ej: Orden de Compra #123) con el que ingresó al almacén.
