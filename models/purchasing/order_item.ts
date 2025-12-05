import { serial, integer } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import purchase_order from "./purchase_order";
import { item } from "../inventory/item";
import { decimal } from "../../lib/db/custom-types";

/**
 * Modelo de ítem de orden de compra (OrderItem)
 * Representa un producto y su cantidad en una orden de compra.
 */
const order_item = schema.table("purchasing_order_item", {
  /** Identificador único del ítem */
  id: serial("id").primaryKey(),
  /** Identificador de la orden de compra */
  purchaseOrderId: integer("purchase_order_id")
    .notNull()
    .references(() => purchase_order.id),
  /** Identificador del ítem del catálogo de inventario */
  itemId: integer("item_id")
    .notNull()
    .references(() => item.id),
  /** Cantidad ordenada */
  quantity: integer("quantity").notNull(),
  /** Precio unitario del producto */
  unitPrice: decimal("unit_price").notNull(),
});

export default order_item;
