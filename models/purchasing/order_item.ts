import { serial, integer } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import purchase_order from "./purchase_order";
import product from "../inventory/product";
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
  /** Identificador del producto del catálogo de inventario */
  productId: integer("product_id")
    .notNull()
    .references(() => product.id),
  /** Cantidad ordenada */
  quantity: integer("quantity").notNull(),
  /** Precio unitario del producto */
  unitPrice: decimal("unit_price").notNull(),
});

export default order_item;
