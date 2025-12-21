/**
 * Modelo Agape
 *
 * Representa una entidad clave-valor genérica para configuraciones
 * o datos globales del sistema.
 */
import type {
  ColumnType,
  Selectable,
  Insertable,
  Updateable,
} from "./types";

export interface AgapeTable {
  /** Clave única de la entidad (PK) */
  key: string;

  /** Valor en formato JSON */
  value: unknown;

  /** Fecha de creación */
  createdAt: ColumnType<Date, Date | undefined, never>;

  /** Fecha de última actualización */
  updatedAt: ColumnType<Date, Date | undefined, Date | undefined>;
}

export type Agape = Selectable<AgapeTable>;
export type NewAgape = Insertable<AgapeTable>;
export type AgapeUpdate = Updateable<AgapeTable>;