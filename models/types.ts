/**
 * Tipos base y helpers para Kysely
 *
 * Este archivo centraliza las re-exportaciones de Kysely y define
 * tipos helper para uso común en los modelos.
 */
import type {
    ColumnType,
    Generated,
    Selectable,
    Insertable,
    Updateable,
} from "kysely";

export type { ColumnType, Generated, Selectable, Insertable, Updateable };

/**
 * Helper para campos created_at:
 * - SELECT: Date
 * - INSERT: Date | undefined (opcional, usa default de DB)
 * - UPDATE: never (no se puede modificar)
 */
export type CreatedAt = ColumnType<Date, Date | undefined, never>;

/**
 * Helper para campos updated_at:
 * - SELECT: Date
 * - INSERT: Date | undefined (opcional, usa default de DB)
 * - UPDATE: Date | undefined (opcional, se puede actualizar)
 */
export type UpdatedAt = ColumnType<Date, Date | undefined, Date | undefined>;
