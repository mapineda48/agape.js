# Administración de Clientes

La ficha del cliente en Agape.js es el punto de partida para toda la operación comercial. El sistema permite gestionar tanto personas naturales como empresas de forma unificada.

## Tipos de Clientes

1.  **Personas Naturales:** Identificadas por sus nombres y apellidos.
2.  **Empresas (Personas Jurídicas):** Identificadas por su Razón Social (Nombre Legal) y Nombre Comercial.

## Información Comercial

Configurar correctamente estos campos agiliza la creación de pedidos y facturas:

*   **Lista de Precios:** Define automáticamente los precios base de los productos para este cliente.
*   **Condiciones de Pago:** Establece el plazo otorgado para el pago de facturas (ej: Contado, 30 días).
*   **Cupo de Crédito (Credit Limit):** Monto máximo de deuda permitido para el cliente.
*   **Vendedor Asignado:** Permite el seguimiento de la gestión comercial y cálculo de comisiones.

## Contactos y Direcciones

*   **Multicanal:** El sistema permite registrar correo electrónico, teléfono fijo, móvil y WhatsApp principal.
*   **Direcciones:** Puede configurar múltiples direcciones para un mismo cliente, clasificándolas como "Facturación" o "Envío".

## Reglas de Validación

*   **No Duplicidad:** El sistema impide la creación de dos clientes con el mismo tipo y número de documento de identidad.
*   **Estado del Cliente:** Un cliente marcado como "Inactivo" no podrá ser seleccionado para la creación de nuevos pedidos.
*   **Normalización:** Los datos básicos de identificación se validan para asegurar la integridad de la información legal.
