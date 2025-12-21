/**
 * Modelo de empleado (Employee)
 *
 * Representa un empleado dentro de la organización.
 * Implementa Class Table Inheritance (CTI): PK = FK a person.id.
 * El id NO es Generated porque se hereda del registro padre en person.
 */
import type {
    Generated,
    CreatedAt,
    UpdatedAt,
    Selectable,
    Insertable,
    Updateable,
} from "../types";

export interface EmployeeTable {
    /**
     * Identificador único del empleado.
     * Es FK a person.id (un empleado ES una persona).
     * No es Generated: el id se asigna desde la tabla padre person.
     */
    id: number;

    /**
     * Departamento al que pertenece el empleado.
     * Usado para estructura organizacional, reportes y centros de costo.
     */
    departmentId: number | null;

    /** Fecha de contratación */
    hireDate: Date;

    /**
     * Fecha de terminación del contrato.
     * NULL si el empleado sigue activo.
     */
    terminationDate: Date | null;

    /** Indica si el empleado está activo */
    isActive: boolean;

    /** Metadatos adicionales del empleado */
    metadata: unknown | null;

    /** URL del avatar del empleado */
    avatarUrl: string;

    /** Fecha de creación del registro */
    createdAt: CreatedAt;

    /** Fecha de última actualización del registro */
    updatedAt: UpdatedAt;
}

/**
 * Tabla pivote para relación many-to-many entre empleados y cargos.
 * Un empleado puede tener múltiples cargos.
 * Un cargo puede ser ocupado por múltiples empleados.
 */
export interface EmployeeJobPositionTable {
    /** FK al empleado */
    employeeId: number;

    /** FK al cargo */
    jobPositionId: number;

    /**
     * Indica si este es el cargo principal del empleado.
     * Solo uno por empleado debería tener isPrimary = true.
     */
    isPrimary: boolean;

    /** Fecha desde la cual el empleado ocupa este cargo */
    startDate: Date;

    /** Fecha hasta la cual ocupó el cargo (NULL si está activo) */
    endDate: Date | null;
}

// Types para Employee
export type Employee = Selectable<EmployeeTable>;
export type NewEmployee = Insertable<EmployeeTable>;
export type EmployeeUpdate = Updateable<EmployeeTable>;

// Types para EmployeeJobPosition
export type EmployeeJobPosition = Selectable<EmployeeJobPositionTable>;
export type NewEmployeeJobPosition = Insertable<EmployeeJobPositionTable>;
export type EmployeeJobPositionUpdate = Updateable<EmployeeJobPositionTable>;
