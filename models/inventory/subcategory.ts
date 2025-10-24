import { schema } from "../agape";
import { serial, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { category } from "./category";
import { relations } from "drizzle-orm";


/**
 * Modelo de subcategoría de inventario (Subcategory)
 * Representa una subcategoría asociada a una categoría de inventario.
 */
export const subcategory = schema.table("inventory_subcategories", {
    /** Identificador único de la subcategoría */
    id: serial("id").primaryKey(),
    /** Nombre completo de la subcategoría */
    fullName: varchar("fullName", { length: 50 }).notNull(),
    /** Indica si la subcategoría está habilitada */
    isEnabled: boolean("isEnabled").notNull(),
    /** Identificador de la categoría asociada */
    categoryId: integer("categoryId")
        .notNull()
        .references(() => category.id, { onDelete: "restrict" }),
});

export const categoryRelations = relations(category, ({ many }) => ({
    subcategories: many(subcategory),
}));