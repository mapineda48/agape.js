/**
 * Modelo de Cargo (Job Position)
 *
 * Representa un cargo o puesto de trabajo dentro de la organización.
 * Esto es diferente de los roles de seguridad (security_role) que controlan
 * permisos de acceso al sistema.
 *
 * ## Ejemplos de cargos:
 * - Gerente de Ventas
 * - Contador
 * - Desarrollador Senior
 * - Recepcionista
 *
 * ## ¿Por qué separar cargo de rol de seguridad?
 * - Un \"Gerente de Ventas\" (cargo) puede o no tener permiso para crear facturas.
 * - Un \"Desarrollador\" (cargo) puede tener permisos de admin del sistema.
 * - Los cargos son de HR, los roles de seguridad son de IT/Sistema.
 */
import type {
    Generated,
    CreatedAt,
    UpdatedAt,
    Selectable,
    Insertable,
    Updateable,
} from "../types";

export interface JobPositionTable {
    /** Identificador único del cargo */
    id: Generated<number>;

    /** Código corto del cargo (ej: GV001, DEV001) */
    code: string;

    /** Nombre del cargo (ej: Gerente de Ventas) */
    name: string;

    /** Descripción detallada del cargo y responsabilidades */
    description: string | null;

    /**
     * Nivel jerárquico del cargo (1 = más alto, mayor número = menor nivel).
     * Útil para organigramas y reportes de estructura organizacional.
     */
    level: Generated<number>;

    /** Indica si el cargo está activo */
    isActive: boolean;

    /** Fecha de creación del cargo */
    createdAt: CreatedAt;

    /** Fecha de última actualización del cargo */
    updatedAt: UpdatedAt;
}

export type JobPosition = Selectable<JobPositionTable>;
export type NewJobPosition = Insertable<JobPositionTable>;
export type JobPositionUpdate = Updateable<JobPositionTable>;
