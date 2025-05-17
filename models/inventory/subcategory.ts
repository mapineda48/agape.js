import { schema } from "#models/agape";
import { serial, varchar, boolean, integer } from "drizzle-orm/pg-core";
import { category } from "./category";
import { relations } from "drizzle-orm";

export const subcategory = schema.table("inventory_subcategories", {
    id: serial("id").primaryKey(),
    fullName: varchar("fullName", { length: 50 }).notNull(),
    isEnabled: boolean("isEnabled").notNull(),

    // FK a categories.id con ON DELETE RESTRICT
    categoryId: integer("categoryId")
        .notNull()
        .references(() => category.id, { onDelete: "restrict" }),
});

export const categoryRelations = relations(category, ({ many }) => ({
    subcategories: many(subcategory),
}));