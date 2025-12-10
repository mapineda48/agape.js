import { schema } from "../agape";
import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Grupo de Impuestos (Tax Group)
 *
 * Agrupa impuestos para facilitar su asignación a ítems del catálogo.
 * Ejemplos:
 * - "Productos Gravados" (incluye IVA 19%)
 * - "Productos Exentos" (sin IVA)
 * - "Servicios Gravados" (IVA 19% + retención)
 * - "Canasta Familiar" (IVA 5%)
 *
 * Un grupo puede contener uno o varios impuestos (relación N:M mediante tax_group_tax).
 * Los ítems del catálogo se asignan a un grupo de impuestos.
 */
export const taxGroup = schema.table(
  "finance_tax_group",
  {
    /** Identificador único del grupo de impuestos */
    id: serial("id").primaryKey(),

    /** Código interno del grupo de impuestos */
    code: varchar("code", { length: 20 }).notNull(),

    /** Nombre del grupo de impuestos */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Descripción del grupo */
    description: varchar("description", { length: 200 }),

    /** Indica si el grupo de impuestos está habilitado */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Código único de grupo de impuestos */
    uniqueIndex("ux_finance_tax_group_code").on(table.code),
  ]
);

export type TaxGroup = InferSelectModel<typeof taxGroup>;
export type NewTaxGroup = InferInsertModel<typeof taxGroup>;

export default taxGroup;
