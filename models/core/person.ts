import { integer, varchar } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import user from "./user";
import { dateTime } from "../../lib/db/custom-types";
import {
  relations,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";

/**
 * Modelo de persona (Person)
 * Representa una persona física en el sistema.
 * Implementa Class Table Inheritance (CTI): PK = FK a user.id.
 * El id NO es serial porque se hereda del registro padre en user.
 */
export const person = schema.table("core_person", {
  /**
   * Identificador único de la persona.
   * Es FK a user.id (una persona ES un user).
   * No es serial: el id se asigna desde la tabla padre user.
   */
  id: integer("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "restrict" }),

  /** Nombre de la persona */
  firstName: varchar("first_name", { length: 100 }).notNull(),

  /** Apellido de la persona */
  lastName: varchar("last_name", { length: 100 }).notNull(),

  /** Fecha de nacimiento (opcional si tu dominio lo permite) */
  birthdate: dateTime("birthdate"),
});

/**
 * Relaciones de Person:
 * - Cada persona pertenece a exactamente una user.
 */
export const personRelations = relations(person, ({ one }) => ({
  user: one(user, {
    fields: [person.id],
    references: [user.id],
  }),
}));

export type Person = InferSelectModel<typeof person>;
export type NewPerson = InferInsertModel<typeof person>;

export default person;
