# Unidades de Medida (UOM)

Las Unidades de Medida permiten estandarizar cómo se cuentan y miden los productos en el inventario. Cada producto debe tener asignada una unidad de medida base.

## Características Principales

*   **Código Normalizado:** El sistema convierte automáticamente los códigos a mayúsculas y elimina espacios extras (ej: `kg ` se convierte en `KG`).
*   **Nombre Descriptivo:** Un nombre claro para identificar la unidad (ej: `Kilogramo`).
*   **Estado (Habilitado/Deshabilitado):** Permite activar o desactivar unidades.

## Reglas de Control

Para mantener la integridad de la información, el sistema aplica las siguientes reglas:

1.  **Unicidad de Nombre:** No se permite crear dos unidades con el mismo nombre pero diferente código. Esto evita confusiones en los reportes (ej: tener `KG` como Kilogramo y `KILO` como Kilogramo).
2.  **Protección de Datos:** No se puede deshabilitar una unidad de medida si:
    *   Existen productos configurados con esa unidad.
    *   Existen reglas de conversión activas que utilicen dicha unidad.

## Recomendaciones de Uso
*   Utilice códigos cortos y estandarizados (ISO).
*   Asegúrese de configurar correctamente la unidad base antes de empezar a registrar movimientos de inventario.
