import { schema } from "../agape";
import { serial, integer } from "drizzle-orm/pg-core";
import { product } from "./product";
import { location } from "./location";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const stock = schema.table("inventory_stock", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "restrict" }),
  // Si hoy no manejas ubicaciones, puedes dejarlo nullable
  locationId: integer("location_id").references(() => location.id, {
    onDelete: "restrict",
  }),
  quantity: integer("quantity").notNull(),
});

export type Stock = InferSelectModel<typeof stock>;
export type NewStock = InferInsertModel<typeof stock>;

export default stock;
