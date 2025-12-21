/**
 * Modelo de Departamento (Department)
 *
 * Representa una unidad organizacional dentro de la empresa.
 * Los departamentos son fundamentales para:
 * - Estructura organizacional y organigramas
 * - Centros de costo para contabilidad
 * - Asignación de presupuestos
 * - Reportes de nómina por área
 *
 * ## Características:
 * - Soporta jerarquía (departamentos padre-hijo)
 * - Puede vincularse a un centro de costo
 * - Tiene un gerente/responsable (opcional)
 */
import type {
    Generated,
    CreatedAt,
    UpdatedAt,
    Selectable,
    Insertable,
    Updateable,
} from "../types";

export interface DepartmentTable {
    /** Identificador único del departamento */
    id: Generated<number>;

    /** Código del departamento (ej: SALES, HR, DEV) */
    code: string;

    /** Nombre del departamento (ej: Ventas, Recursos Humanos) */
    name: string;

    /** Descripción del departamento */
    description: string | null;

    /**
     * Departamento padre (para jerarquías).
     * NULL si es un departamento raíz.
     */
    parentId: number | null;

    /**
     * Código de centro de costo asociado.
     * Usado para contabilidad y control de gastos.
     */
    costCenterCode: string | null;

    /**
     * ID del empleado responsable/gerente del departamento.
     */
    managerId: number | null;

    /** Indica si el departamento está activo */
    isActive: boolean;

    /** Fecha de creación del departamento */
    createdAt: CreatedAt;

    /** Fecha de última actualización del departamento */
    updatedAt: UpdatedAt;
}

export type Department = Selectable<DepartmentTable>;
export type NewDepartment = Insertable<DepartmentTable>;
export type DepartmentUpdate = Updateable<DepartmentTable>;
