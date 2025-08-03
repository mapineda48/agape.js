import { serial, integer, numeric } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import purchase_order from "./purchase_order";
import product from "#models/inventory/product";

const order_item = schema.table("purchasing_order_item", {
  id: serial("id").primaryKey(),
  purchaseOrderId: integer("purchase_order_id").notNull().references(() => purchase_order.id),
  productId: integer("product_id").notNull().references(() => product.id),                          // producto del catálogo de inventario
  quantity: integer("quantity").notNull(),                                                          // cantidad ordenada
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),                          // precio unitario del producto
});

export default order_item;
