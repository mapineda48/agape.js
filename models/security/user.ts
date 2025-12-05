import {
  serial,
  varchar,
  text,
  integer,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { schema } from "../agape";
import employee from "../hr/employee";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Modelo de usuario de acceso al sistema (SecurityUser)
 * Representa las credenciales y estado de acceso de un empleado.
 *
 * Relación 1:1 con employee: cada empleado puede tener máximo un usuario de acceso.
 * Si necesitas multi-login por empleado, elimina el uniqueIndex sobre employeeId.
 */
export const securityUser = schema.table(
  "security_user",
  {
    /** Identificador único del usuario de acceso */
    id: serial("id").primaryKey(),

    /** Identificador del empleado relacionado (único para relación 1:1) */
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employee.id),

    /** Nombre de usuario (único en el sistema) */
    username: varchar("username", { length: 64 }).notNull().unique(),

    /** Hash de la contraseña */
    password: text("password_hash").notNull(),

    /** Indica si el usuario está activo */
    isActive: boolean("is_active").default(true).notNull(),

    /** Indica si el usuario está bloqueado */
    isLocked: boolean("is_locked").default(false).notNull(),

    /** Fecha y hora del último acceso */
    lastLogin: dateTime("last_login"),

    /** Fecha de creación del usuario */
    created_at: dateTime("created_at")
      .default(sql`now()`)
      .notNull(),

    /** Fecha de última actualización */
    updateAt: dateTime("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    /**
     * Restricción de unicidad: un empleado solo puede tener un usuario de acceso.
     * Esto implementa la relación 1:1 Employee ↔ SecurityUser.
     */
    uniqueIndex("ux_security_user_employee_id").on(table.employeeId),
  ]
);

export const securityUserRelations = relations(securityUser, ({ one }) => ({
  employee: one(employee, {
    fields: [securityUser.employeeId],
    references: [employee.id],
  }),
}));

export default securityUser;
