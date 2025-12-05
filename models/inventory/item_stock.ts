// inventory/item_stock.ts
import { schema } from "../agape";
import { integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { item } from "./item";
import { decimal } from "../../lib/db/custom-types";
// import { unitOfMeasure } from "./unit_of_measure"; // suponiendo que tengas esto

/**
 * Detalle de inventario para ítems que manejan stock.
 * Un registro por ítem inventariable.
 */
export const inventoryItemStock = schema.table("inventory_item_stock", {
  /** FK al ítem maestro (1:1) */
  itemId: integer("item_id")
    .primaryKey()
    .references(() => item.id, { onDelete: "cascade" }),

  /** Unidad de medida base */
  uomId: integer("uom_id").notNull(), // .references(() => unitOfMeasure.id)

  /** Indica si este ítem se controla por inventario */
  trackStock: boolean("track_stock").notNull().default(true),

  /** Stock mínimo recomendado */
  minStock: decimal("min_stock"),

  /** Stock máximo recomendado */
  maxStock: decimal("max_stock"),

  /** Punto de reorden */
  reorderPoint: decimal("reorder_point"),
});

export type InventoryItemStock = InferSelectModel<typeof inventoryItemStock>;
export type NewInventoryItemStock = InferInsertModel<typeof inventoryItemStock>;
