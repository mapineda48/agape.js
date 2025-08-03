import { serial, integer, numeric } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import purchase_order from "./purchase_order";
import product from "#models/inventory/product";


/**
 * Modelo de ítem de orden de compra (OrderItem)
 * Representa un producto y su cantidad en una orden de compra.
 */
const order_item = schema.table("purchasing_order_item", {
  /** Identificador único del ítem */
  id: serial("id").primaryKey(),
  /** Identificador de la orden de compra */
  purchaseOrderId: integer("purchase_order_id").notNull().references(() => purchase_order.id),
  /** Identificador del producto del catálogo de inventario */
  productId: integer("product_id").notNull().references(() => product.id),
  /** Cantidad ordenada */
  quantity: integer("quantity").notNull(),
  /** Precio unitario del producto */
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
});

export default order_item;
