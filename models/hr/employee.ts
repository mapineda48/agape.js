import {
  integer,
  boolean,
  primaryKey,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { schema } from "../agape";
import person from "../core/person";
import role from "./role";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Modelo de empleado (Employee)
 * Representa un empleado dentro de la organización.
 * Implementa Class Table Inheritance (CTI): PK = FK a person.id.
 * El id NO es serial porque se hereda del registro padre en person.
 */
const employee = schema.table("hr_employee", {
  /**
   * Identificador único del empleado.
   * Es FK a person.id (un empleado ES una persona).
   * No es serial: el id se asigna desde la tabla padre person.
   */
  id: integer("id")
    .primaryKey()
    .references(() => person.id, { onDelete: "restrict" }),

  /** Fecha de contratación */
  hireDate: dateTime("hire_date")
    .default(sql`now()`)
    .notNull(),

  /** Indica si el empleado está activo */
  isActive: boolean("is_active").default(true).notNull(),

  /** Metadatos adicionales del empleado */
  metadata: jsonb("metadata"),

  /** URL del avatar del empleado */
  avatarUrl: varchar("avatar_url", { length: 255 }).notNull(),

  /** Fecha de creación del registro */
  createdAt: dateTime("created_at")
    .default(sql`now()`)
    .notNull(),

  /** Fecha de última actualización del registro */
  updatedAt: dateTime("updated_at")
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

/**
 * Tabla pivote para relación many-to-many entre empleados y roles.
 * PK compuesta (employeeId, roleId).
 */
export const employeeRole = schema.table(
  "hr_employee_roles",
  {
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employee.id),
    roleId: integer("role_id")
      .notNull()
      .references(() => role.id),
  },
  (table) => [primaryKey({ columns: [table.employeeId, table.roleId] })]
);

export const personRelations = relations(person, ({ one }) => ({
  employee: one(employee),
}));

export const roleRelations = relations(role, ({ many }) => ({
  employeeRoles: many(employeeRole),
}));

export const employeeRelations = relations(employee, ({ one, many }) => ({
  person: one(person, {
    fields: [employee.id],
    references: [person.id],
  }),

  employeeRoles: many(employeeRole),
}));

export const employeeRoleRelations = relations(employeeRole, ({ one }) => ({
  employee: one(employee, {
    fields: [employeeRole.employeeId],
    references: [employee.id],
  }),
  role: one(role, {
    fields: [employeeRole.roleId],
    references: [role.id],
  }),
}));

export default employee;
