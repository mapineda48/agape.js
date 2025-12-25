import { schema } from "../schema";
import { integer, boolean, smallint } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { item } from "./item";

/**
 * Detalle sólo para ítems de tipo servicio.
 */
export const service = schema.table("catalogs_service", {
  /** FK al ítem maestro (1:1) */
  itemId: integer("item_id")
    .primaryKey()
    .references(() => item.id, { onDelete: "cascade" }),

  /** Duración del servicio en minutos (si aplica) */
  durationMinutes: smallint("duration_minutes"),

  /** Indica si es un servicio recurrente */
  isRecurring: boolean("is_recurring").notNull().default(false),
});

export type Service = InferSelectModel<typeof service>;
export type NewService = InferInsertModel<typeof service>;
