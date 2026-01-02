# Registro de Proveedores

Agape.js permite mantener un registro detallado de todas las entidades (personas o empresas) que suministran bienes o servicios a su organización.

## Tipos de Proveedores

El sistema permite clasificar a los proveedores para facilitar el reporteo:
*   **Personas Naturales:** Proveedores identificados por sus nombres individuales.
*   **Personas Jurídicas:** Empresas identificadas por su Razón Social y Nombre Comercial.

## Información del Maestro

Al crear un proveedor, se gestionan los siguientes datos:
*   **Identificación Legal:** Tipo y número de documento, validando la no duplicidad en el sistema.
*   **Datos de Contacto:** Dirección, teléfonos y correos electrónicos para la comunicación operativa.
*   **Estado:** Un proveedor debe estar "Activo" para poder generarle órdenes de compra.

## Reglas de Validación
1.  **Validación de Documento:** El sistema no permite crear dos proveedores con la misma identificación legal.
2.  **Integridad con Usuarios:** Cada proveedor está vinculado internamente a un registro de usuario centralizado, lo que facilita el seguimiento de sus transacciones en toda la plataforma.
