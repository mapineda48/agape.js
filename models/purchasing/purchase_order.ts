import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { serial, integer, date } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import supplier from "./supplier";
import { dateTime } from "../../lib/db/custom-types";

export const purchaseOrderStatusEnum = schema.enum(
  "purchasing_purchase_order_status",
  ["pending", "approved", "received", "cancelled"]
);

/**
 * Modelo de orden de compra (PurchaseOrder)
 * Representa una orden de compra realizada a un proveedor.
 */
const purchase_order = schema.table("purchasing_purchase_order", {
  /** Identificador único de la orden de compra */
  id: serial("id").primaryKey(),
  /** Identificador del proveedor */
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => supplier.id),
  /** Fecha de la orden de compra */
  orderDate: dateTime("order_date").notNull(),
  /** Estado de la orden (ej: 'pending', 'received', 'cancelled') */
  status: purchaseOrderStatusEnum("status").default("pending").notNull(),
});

export type PurchaseOrder = InferSelectModel<typeof purchase_order>;
export type NewPurchaseOrder = InferInsertModel<typeof purchase_order>;
export type PurchaseOrderStatus =
  (typeof purchaseOrderStatusEnum.enumValues)[number];

export default purchase_order;
