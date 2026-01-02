# Estructura Organizacional (Departamentos)

Este submódulo permite modelar la jerarquía de su empresa, definiendo cómo se agrupan los colaboradores y cómo se distribuyen los costos operacionales.

## Atributos del Departamento

*   **Código y Nombre:** Identificadores únicos para el área (ej: COD-CONT, Contabilidad).
*   **Jerarquía (Departamento Padre):** Permite crear estructuras en árbol. Por ejemplo, el departamento "Tesorería" puede ser hijo de "Finanzas".
*   **Director o Gerente (Manager):** Asignación del responsable del departamento para flujos de aprobación futuros.
*   **Centro de Costos:** Código contable vinculado al departamento para la distribución financiera de gastos.

## Jerarquía y Organización
El sistema permite una estructura multinivel, lo que facilita:
1.  **Reporteo Consolidado:** Ver gastos o cantidad de personal por áreas padre.
2.  **Control de Accesos:** Futuras implementaciones de permisos basados en la estructura departamental.
3.  **Estandarización:** Asegurar que cada colaborador pertenezca a un área específica para efectos de procesos administrativos.

## Reglas de Negocio
*   **Códigos Únicos:** No se permite duplicar códigos de departamentos.
*   **Integridad Jerárquica:** El sistema valida que un departamento no pueda ser padre de sí mismo para evitar bucles infinitos en la estructura.
