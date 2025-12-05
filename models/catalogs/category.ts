import { schema } from "../agape";
import { serial, varchar, boolean } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Modelo de categoría de inventario (Category)
 * Representa una categoría dentro del inventario.
 */
export const category = schema.table("inventory_categories", {
  /** Identificador único de la categoría */
  id: serial("id").primaryKey(),
  /** Nombre completo de la categoría */
  fullName: varchar("full_name", { length: 50 }).notNull(),
  /** Indica si la categoría está habilitada */
  isEnabled: boolean("is_enabled").notNull(),
});

export type Category = InferSelectModel<typeof category>;
export type NewCategory = InferInsertModel<typeof category>;

export default category;
