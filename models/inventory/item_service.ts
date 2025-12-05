// inventory/item_service.ts
import { schema } from "../agape";
import { integer, boolean, smallint } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { item } from "./item";

/**
 * Detalle sólo para ítems de tipo servicio.
 */
export const inventoryItemService = schema.table("inventory_item_service", {
  /** FK al ítem maestro (1:1) */
  itemId: integer("item_id")
    .primaryKey()
    .references(() => item.id, { onDelete: "cascade" }),

  /** Duración del servicio en minutos (si aplica) */
  durationMinutes: smallint("duration_minutes"),

  /** Indica si es un servicio recurrente */
  isRecurring: boolean("is_recurring").notNull().default(false),
});

export type InventoryItemService = InferSelectModel<
  typeof inventoryItemService
>;
export type NewInventoryItemService = InferInsertModel<
  typeof inventoryItemService
>;
