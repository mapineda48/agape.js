import ctx from "../../lib/db/schema/ctx";
import { serial, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { category } from "./category";
import { relations } from "drizzle-orm";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Modelo de subcategoría de catálogo (Subcategory)
 * Representa una subcategoría asociada a una categoría de catálogo.
 */
export const subcategory = ctx(({ table }) => table("catalogs_subcategories", {
  /** Identificador único de la subcategoría */
  id: serial("id").primaryKey(),
  /** Nombre completo de la subcategoría */
  fullName: varchar("full_name", { length: 50 }).notNull(),
  /** Indica si la subcategoría está habilitada */
  isEnabled: boolean("is_enabled").notNull(),
  /** Identificador de la categoría asociada */
  categoryId: integer("category_id")
    .notNull()
    .references(() => category.id, { onDelete: "restrict" }),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  subcategories: many(subcategory),
}));

export type Subcategory = InferSelectModel<typeof subcategory>;
export type NewSubcategory = InferInsertModel<typeof subcategory>;

export default subcategory;
