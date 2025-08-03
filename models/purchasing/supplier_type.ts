import { serial, varchar } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";


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

export default supplier_type;
