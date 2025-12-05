import { schema } from "../agape";
import { serial, integer } from "drizzle-orm/pg-core";
import item from "./item";
import { location } from "./location";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Tabla de stock por ítem y ubicación.
 * Almacena la cantidad disponible de cada ítem inventariable en cada ubicación.
 */
export const stock = schema.table("inventory_stock", {
  id: serial("id").primaryKey(),

  /** Referencia al ítem maestro */
  itemId: integer("item_id")
    .notNull()
    .references(() => item.itemId, { onDelete: "restrict" }),

  /** Ubicación (bodega). Nullable para soportar stock sin ubicación específica */
  locationId: integer("location_id").references(() => location.id, {
    onDelete: "restrict",
  }),

  /** Cantidad disponible */
  quantity: integer("quantity").notNull(),
});

export type Stock = InferSelectModel<typeof stock>;
export type NewStock = InferInsertModel<typeof stock>;

export default stock;
