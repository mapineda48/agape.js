/**
 * Modelo de persona (Person)
 *
 * Representa una persona física en el sistema.
 * Implementa Class Table Inheritance (CTI): PK = FK a user.id.
 * El id NO es Generated porque se hereda del registro padre en user.
 *
 * ## Relaciones
 *
 * - **User**: Cada persona ES un user (herencia CTI).
 * - **Empresas como contacto**: Una persona puede estar asociada como
 *   contacto a múltiples empresas a través de `core_company_contact`.
 */
import type { Selectable, Insertable, Updateable } from "./types";

export interface PersonTable {
  /**
   * Identificador único de la persona.
   * Es FK a user.id (una persona ES un user).
   * No es Generated: el id se asigna desde la tabla padre user.
   */
  id: number;

  /** Nombre de la persona */
  firstName: string;

  /** Apellido de la persona */
  lastName: string;

  /** Fecha de nacimiento (opcional) */
  birthdate: Date | null;
}

export type Person = Selectable<PersonTable>;
export type NewPerson = Insertable<PersonTable>;
export type PersonUpdate = Updateable<PersonTable>;
