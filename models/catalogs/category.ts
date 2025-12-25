import { schema } from "../schema";
import { serial, varchar, boolean } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Modelo de categoría de catálogo (Category)
 * Representa una categoría genérica para organizar ítems del catálogo.
 * La tabla se renombró a catalogs_categories para consistencia con catalogs_subcategories.
 */
export const category = schema.table("catalogs_categories", {
  /** Identificador único de la categoría */
  id: serial("id").primaryKey(),

  /** Nombre completo de la categoría */
  fullName: varchar("full_name", { length: 50 }).notNull(),

  /** Indica si la categoría está habilitada */
  isEnabled: boolean("is_enabled").notNull().default(true),
});

export type Category = InferSelectModel<typeof category>;
export type NewCategory = InferInsertModel<typeof category>;

export default category;
