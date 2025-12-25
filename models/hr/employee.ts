import {
  integer,
  boolean,
  primaryKey,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { schema } from "../schema";
import person from "../core/person";
import jobPosition from "./job_position";
import department from "./department";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Modelo de empleado (Employee)
 * Representa un empleado dentro de la organización.
 * Implementa Class Table Inheritance (CTI): PK = FK a person.id.
 * El id NO es serial porque se hereda del registro padre en person.
 *
 * ## Cambios de auditoría aplicados:
 * - Agregada referencia a department (estructura organizacional)
 * - Cambiado de role a job_position (cargo de negocio vs rol de seguridad)
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

  /**
   * Departamento al que pertenece el empleado.
   * Usado para estructura organizacional, reportes y centros de costo.
   */
  departmentId: integer("department_id").references(() => department.id, {
    onDelete: "set null",
  }),

  /** Fecha de contratación */
  hireDate: dateTime("hire_date")
    .default(sql`now()`)
    .notNull(),

  /**
   * Fecha de terminación del contrato.
   * NULL si el empleado sigue activo.
   */
  terminationDate: dateTime("termination_date"),

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
 * Tabla pivote para relación many-to-many entre empleados y cargos.
 * Un empleado puede tener múltiples cargos (ej: Gerente de Ventas + Encargado de Sucursal).
 * Un cargo puede ser ocupado por múltiples empleados.
 *
 * NOTA: Esto es para cargos de negocio (job_position), NO para roles de seguridad.
 * Los roles de seguridad se asignan a través de security_user_role.
 */
export const employeeJobPosition = schema.table(
  "hr_employee_job_position",
  {
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    jobPositionId: integer("job_position_id")
      .notNull()
      .references(() => jobPosition.id, { onDelete: "cascade" }),

    /**
     * Indica si este es el cargo principal del empleado.
     * Solo uno por empleado debería tener isPrimary = true.
     */
    isPrimary: boolean("is_primary").default(false).notNull(),

    /** Fecha desde la cual el empleado ocupa este cargo */
    startDate: dateTime("start_date")
      .default(sql`now()`)
      .notNull(),

    /** Fecha hasta la cual ocupó el cargo (NULL si está activo) */
    endDate: dateTime("end_date"),
  },
  (table) => [primaryKey({ columns: [table.employeeId, table.jobPositionId] })]
);

// ============================================================================
// Relaciones
// ============================================================================

export const personRelations = relations(person, ({ one }) => ({
  employee: one(employee),
}));

export const jobPositionRelations = relations(jobPosition, ({ many }) => ({
  employees: many(employeeJobPosition),
}));

export const departmentEmployeeRelations = relations(
  department,
  ({ many }) => ({
    employees: many(employee),
  })
);

export const employeeRelations = relations(employee, ({ one, many }) => ({
  person: one(person, {
    fields: [employee.id],
    references: [person.id],
  }),

  department: one(department, {
    fields: [employee.departmentId],
    references: [department.id],
  }),

  /** Cargos del empleado (many-to-many vía tabla pivote) */
  jobPositions: many(employeeJobPosition),
}));

export const employeeJobPositionRelations = relations(
  employeeJobPosition,
  ({ one }) => ({
    employee: one(employee, {
      fields: [employeeJobPosition.employeeId],
      references: [employee.id],
    }),
    jobPosition: one(jobPosition, {
      fields: [employeeJobPosition.jobPositionId],
      references: [jobPosition.id],
    }),
  })
);

export default employee;
