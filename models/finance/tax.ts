import { schema } from "../agape";
import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { decimal } from "../../lib/db/custom-types";

/**
 * Impuesto (Tax)
 *
 * Representa los diferentes tipos de impuestos del sistema.
 * Ejemplos: IVA 19%, IVA 5%, Exento, INC 8%, etc.
 *
 * Cada impuesto tiene una tasa que se aplica sobre la base gravable.
 * Se agrupan mediante finance_tax_group para facilitar la asignación a ítems.
 */
export const tax = schema.table(
  "finance_tax",
  {
    /** Identificador único del impuesto */
    id: serial("id").primaryKey(),

    /** Código interno del impuesto (ej: IVA19, IVA5, EXE, INC8) */
    code: varchar("code", { length: 20 }).notNull(),

    /** Nombre del impuesto */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Descripción adicional del impuesto */
    description: varchar("description", { length: 200 }),

    /**
     * Tasa del impuesto en porcentaje.
     * Ej: 19.00 para IVA 19%, 0.00 para exento
     */
    rate: decimal("rate").notNull(),

    /** Indica si el impuesto está habilitado */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Código único de impuesto */
    uniqueIndex("ux_finance_tax_code").on(table.code),
  ]
);

export type Tax = InferSelectModel<typeof tax>;
export type NewTax = InferInsertModel<typeof tax>;

export default tax;
