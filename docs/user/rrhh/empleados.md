# Gestión de Empleados

La ficha del empleado centraliza toda la información relacionada con el colaborador dentro de la organización.

## Datos del Colaborador

Agape.js gestiona la información agrupándola en tres niveles:

1.  **Datos Personales:** Nombres, apellidos, fecha de nacimiento y tipo/número de identificación legal. Estos datos se comparten con el maestro central de personas.
2.  **Información Contractual:** 
    *   **Fecha de Ingreso:** Registro oficial del inicio de labores.
    *   **Estado:** Un empleado puede estar "Activo" o "Inactivo". Los empleados inactivos no pueden ser seleccionados para procesos administrativos como recepción de mercancía o gestión de órdenes.
3.  **Perfil Digital:**
    *   **Avatar:** Fotografía del colaborador para identificación visual en el sistema.
    *   **Usuario Vinculado:** Conexión con las credenciales de acceso para seguimiento de auditoría.

## Reglas de Registro
*   **Identificación Única:** No se pueden registrar dos empleados con el mismo número de documento. El sistema valida esto automáticamente contra el maestro de personas.
*   **Ficha Completa:** Al ser un colaborador interno, es obligatorio registrar la información personal detallada (nombres y apellidos completos).
*   **Trazabilidad:** Cualquier cambio en la ficha del empleado guarda la fecha de actualización y el responsable del cambio.
