import { serial, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { schema } from "../agape";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Modelo de persona (Person)
 * Representa una persona física en el sistema.
 */
const person = schema.table("person", {
  /** Identificador único de la persona */
  id: serial("id").primaryKey(),
  /** Nombre de la persona */
  firstName: varchar("first_name", { length: 100 }).notNull(),
  /** Apellido de la persona */
  lastName: varchar("last_name", { length: 100 }).notNull(),
  /** Fecha de nacimiento */
  birthdate: dateTime("birthdate").notNull(),
  /** Correo electrónico */
  email: varchar("email", { length: 255 }).notNull().unique(),
  /** Teléfono de contacto */
  phone: varchar("phone", { length: 20 }),
  /** Dirección de la persona */
  address: varchar("address", { length: 255 }),
  /** Fecha de creación del registro */
  createdAt: dateTime("created_at").default(sql`now()`),
  /** Fecha de última actualización del registro */
  updateAt: dateTime("updated_at")
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

export default person;
