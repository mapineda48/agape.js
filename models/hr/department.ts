import { serial, varchar, text, boolean, integer } from "drizzle-orm/pg-core";
import {
  relations,
  sql,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import { schema } from "../agape";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Modelo de Departamento (Department)
 *
 * Representa una unidad organizacional dentro de la empresa.
 * Los departamentos son fundamentales para:
 * - Estructura organizacional y organigramas
 * - Centros de costo para contabilidad
 * - Asignación de presupuestos
 * - Reportes de nómina por área
 *
 * ## Ejemplos de departamentos:
 * - Ventas
 * - Recursos Humanos
 * - Desarrollo de Software
 * - Contabilidad
 * - Operaciones
 *
 * ## Características:
 * - Soporta jerarquía (departamentos padre-hijo)
 * - Puede vincularse a un centro de costo
 * - Tiene un gerente/responsable (opcional)
 */
export const department = schema.table("hr_department", {
  /** Identificador único del departamento */
  id: serial("id").primaryKey(),

  /** Código del departamento (ej: SALES, HR, DEV) */
  code: varchar("code", { length: 20 }).notNull().unique(),

  /** Nombre del departamento (ej: Ventas, Recursos Humanos) */
  name: varchar("name", { length: 100 }).notNull(),

  /** Descripción del departamento */
  description: text("description"),

  /**
   * Departamento padre (para jerarquías).
   * NULL si es un departamento raíz.
   * Ejemplo: "Desarrollo Frontend" puede tener como padre "Tecnología"
   */
  parentId: integer("parent_id"),

  /**
   * Código de centro de costo asociado.
   * Usado para contabilidad y control de gastos.
   * Ejemplo: "CC-SALES-001"
   */
  costCenterCode: varchar("cost_center_code", { length: 30 }),

  /**
   * ID del empleado responsable/gerente del departamento.
   * Esta relación se define en employee.ts para evitar dependencias circulares.
   */
  managerId: integer("manager_id"),

  /** Indica si el departamento está activo */
  isActive: boolean("is_active").default(true).notNull(),

  /** Fecha de creación del departamento */
  createdAt: dateTime("created_at")
    .default(sql`now()`)
    .notNull(),

  /** Fecha de última actualización del departamento */
  updatedAt: dateTime("updated_at")
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

/**
 * Relaciones del departamento:
 * - Un departamento puede tener un departamento padre (jerarquía)
 * - Un departamento puede tener múltiples subdepartamentos
 */
export const departmentRelations = relations(department, ({ one, many }) => ({
  /** Departamento padre (si existe) */
  parent: one(department, {
    fields: [department.parentId],
    references: [department.id],
    relationName: "departmentHierarchy",
  }),
  /** Subdepartamentos */
  children: many(department, { relationName: "departmentHierarchy" }),
}));

export type Department = InferSelectModel<typeof department>;
export type NewDepartment = InferInsertModel<typeof department>;

export default department;
