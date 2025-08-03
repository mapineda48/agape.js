import { schema } from "#models/agape";
import { serial, varchar, text, timestamp, boolean, } from "drizzle-orm/pg-core";


/**
 * Modelo de rol de staff (Role)
 * Representa un rol o puesto dentro del staff de la organización.
 */
const role = schema.table("staff_role", {
    /** Identificador único del rol */
    id: serial("id").primaryKey(),
    /** Código corto del rol */
    code: varchar("code", { length: 10 }).notNull(),
    /** Nombre del rol */
    name: varchar("name", { length: 100 }).notNull(),
    /** Descripción del rol */
    description: text("description"),
    /** Indica si el rol está activo */
    isActive: boolean("is_active").default(true).notNull(),
    /** Fecha de creación del rol */
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow(),
    /** Fecha de última actualización del rol */
    updateAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
});

export default role;