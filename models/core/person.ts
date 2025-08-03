import { serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";


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
    birthdate: timestamp("birthdate", { withTimezone: true }).notNull(),
    /** Correo electrónico */
    email: varchar("email", { length: 255 }).notNull().unique(),
    /** Teléfono de contacto */
    phone: varchar("phone", { length: 20 }),
    /** Dirección de la persona */
    address: varchar("address", { length: 255 }),
    /** Fecha de creación del registro */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    /** Fecha de última actualización del registro */
    updateAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdate(() => new Date())
});

export default person;
