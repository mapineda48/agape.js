import { schema } from "../agape";
import { integer, primaryKey } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { taxGroup } from "./tax_group";
import { tax } from "./tax";

/**
 * Relación Grupo de Impuestos - Impuestos (Tax Group Tax)
 *
 * Tabla pivote many-to-many entre grupos de impuestos e impuestos.
 * Permite que un grupo de impuestos contenga múltiples impuestos.
 *
 * Ejemplo:
 * - Grupo "Productos Gravados" → contiene IVA 19%
 * - Grupo "Servicios Profesionales" → contiene IVA 19% + Retención 11%
 */
export const taxGroupTax = schema.table(
  "finance_tax_group_tax",
  {
    /** Grupo de impuestos */
    taxGroupId: integer("tax_group_id")
      .notNull()
      .references(() => taxGroup.id, { onDelete: "cascade" }),

    /** Impuesto que pertenece al grupo */
    taxId: integer("tax_id")
      .notNull()
      .references(() => tax.id, { onDelete: "cascade" }),
  },
  (table) => [
    /** PK compuesta: un impuesto solo puede estar una vez en cada grupo */
    primaryKey({ columns: [table.taxGroupId, table.taxId] }),
  ]
);

export type TaxGroupTax = InferSelectModel<typeof taxGroupTax>;
export type NewTaxGroupTax = InferInsertModel<typeof taxGroupTax>;

export default taxGroupTax;
