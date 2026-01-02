# Multimoneda y Tasas de Cambio

Agape.js está diseñado para operar en un entorno global, permitiendo transacciones en diversas divisas.

## Moneda Base
Es la moneda de curso legal de su empresa (ej: COP, USD, EUR). Todos los reportes financieros se consolidan en esta moneda.
*   **Regla de Oro:** Solo puede existir una moneda base activa.
*   **Tasa de Cambio:** La tasa de la moneda base siempre es **1**.

## Monedas Extranjeras
Puede registrar cualquier cantidad de monedas adicionales.
*   **Tasa de Cambio:** Representa el valor de la divisa respecto a la moneda base.
*   **Actualización:** El sistema permite actualizar las tasas diariamente para asegurar que las nuevas facturas reflejen el valor real del mercado.

## Reglas de Seguridad
*   **Inmutabilidad Histórica:** El cambio en la tasa de una moneda hoy no afecta el valor de las facturas creadas ayer; el sistema guarda la tasa vigente al momento de cada transacción.
*   **Restricción de Desactivación:** No se puede deshabilitar una moneda si hay órdenes de venta activas o facturas pendientes en esa divisa.
*   **Cambio de Moneda Base:** Solo se puede designar una nueva moneda base si esta se encuentra habilitada previamente.
