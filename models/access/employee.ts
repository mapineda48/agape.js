import { serial, varchar, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { schema } from "../agape";
import employee from "../staff/employee";

/**
 * Modelo de usuario de acceso (AccessUser)
 * Representa las credenciales y estado de acceso de un empleado.
 */
export const accessUser = schema.table("access_employee", {
    /** Identificador único del usuario de acceso */
    id: serial("id").primaryKey(),
    /** Identificador del empleado relacionado */
    employeeId: integer("employee_id").notNull().references(() => employee.id),
    /** Nombre de usuario */
    username: varchar("username", { length: 64 }).notNull().unique(),
    /** Hash de la contraseña */
    password: text("password_hash").notNull(),
    /** Indica si el usuario está activo */
    isActive: boolean("is_active").default(true).notNull(),
    /** Indica si el usuario está bloqueado */
    isLocked: boolean("is_locked").default(false).notNull(),
    /** Fecha y hora del último acceso */
    lastLogin: timestamp("last_login", { withTimezone: true }),
    /** Fecha de creación del usuario */
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    /** Fecha de última actualización */
    updateAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
});

export const accessUserRelations = relations(accessUser, ({ one }) => ({
    employee: one(employee, {
        fields: [accessUser.employeeId],
        references: [employee.id],
    }),
}));

export default accessUser;