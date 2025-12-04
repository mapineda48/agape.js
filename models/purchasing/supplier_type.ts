import { serial, varchar } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";


/**
 * Modelo de tipo de proveedor (SupplierType)
 * Representa los diferentes tipos de proveedores.
 */
const supplier_type = schema.table("purchasing_supplier_type", {
  /** Identificador único del tipo de proveedor */
  id: serial("id").primaryKey(),
  /** Nombre del tipo de proveedor */
  name: varchar("name", { length: 50 }).notNull(),
});

export type SupplierType = InferSelectModel<typeof supplier_type>;
export type NewSupplierType = InferInsertModel<typeof supplier_type>;

export default supplier_type;
