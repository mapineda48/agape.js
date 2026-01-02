# Saldos y Stock

Agape.js ofrece una visión multidimensional de sus existencias para una toma de decisiones informada.

## Definiciones de Stock

*   **Cantidad Física (Quantity):** La cantidad real que se encuentra en el estante.
*   **Cantidad Reservada (Reserved):** Cantidad comprometida para pedidos de clientes o procesos internos que aún no han salido del almacén.
*   **Cantidad Disponible (ATP - Available to Promise):** Es el saldo neto real para nuevas operaciones. 
    > Fórmula: `Disponible = Física - Reservada`

## Niveles de Consulta

Puede visualizar sus saldos en tres niveles de detalle:
1.  **Por Item:** Saldo total consolidado de un producto en toda la empresa.
2.  **Por Ubicación:** Saldo de un producto dentro de un almacén o bodega específica.
3.  **Por Lote:** Detalle preciso de cuánto hay de cada lote en cada ubicación.

## Sincronización Automática
El sistema garantiza que el saldo agregado (total de la bodega) coincida siempre con la suma de los saldos por lote. Cada movimiento posteado actualiza estos valores en tiempo real mediante transacciones seguras para evitar inconsistencias por accesos simultáneos.
