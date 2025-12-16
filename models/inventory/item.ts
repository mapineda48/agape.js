import schema from "../schema";
import { integer, boolean } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { item } from "../catalogs/item";
import { decimal } from "../../lib/db/custom-types";
import { unitOfMeasure } from "./unit_of_measure";

/**
 * Detalle de inventario para bienes físicos que manejan stock.
 * Un registro por bien físico inventariable.
 */
export const inventoryItem = schema.table("inventory_item", {
  /** FK al ítem maestro (1:1) */
  itemId: integer("item_id")
    .primaryKey()
    .references(() => item.id, { onDelete: "restrict" }),

  /** Unidad de medida base del ítem inventariable */
  uomId: integer("uom_id")
    .notNull()
    .references(() => unitOfMeasure.id, { onDelete: "restrict" }),

  /** Stock mínimo recomendado */
  minStock: decimal("min_stock"),

  /** Stock máximo recomendado */
  maxStock: decimal("max_stock"),

  /** Punto de reorden */
  reorderPoint: decimal("reorder_point"),

  /**
   * Indica si el ítem requiere número de lote obligatorio.
   * Ej: productos farmacéuticos, alimentos perecederos.
   */
  requiresLot: boolean("requires_lot").notNull().default(false),

  /**
   * Indica si el ítem requiere número de serie individual (cada unidad es única).
   * Ej: equipos electrónicos, vehículos.
   */
  requiresSerial: boolean("requires_serial").notNull().default(false),
});

export type InventoryItem = InferSelectModel<typeof inventoryItem>;
export type NewInventoryItem = InferInsertModel<typeof inventoryItem>;

export default inventoryItem;
