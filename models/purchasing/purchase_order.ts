import { serial, integer, date, varchar } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import supplier from "./supplier";


/**
 * Modelo de orden de compra (PurchaseOrder)
 * Representa una orden de compra realizada a un proveedor.
 */
const purchase_order = schema.table("purchasing_purchase_order", {
  /** Identificador único de la orden de compra */
  id: serial("id").primaryKey(),
  /** Identificador del proveedor */
  supplierId: integer("supplier_id").notNull().references(() => supplier.id),
  /** Fecha de la orden de compra */
  orderDate: date("order_date").defaultNow().notNull(),
  /** Estado de la orden (ej: 'pending', 'received', 'cancelled') */
  status: varchar("status", { length: 20 }).notNull(),
});

export default purchase_order;
