import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { serial, varchar, boolean, smallint, numeric, integer, jsonb } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import { category } from "./category";
import { subcategory } from "./subcategory";

export const product = schema.table("inventory_product", {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 80 }).notNull(),
    slogan: varchar("slogan", { length: 80 }).notNull(),
    description: varchar("description", { length: 500 }),
    isActive: boolean("is_active").notNull(),
    rating: smallint("rating").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "restrict" }),
    subcategoryId: integer("subcategory_id")
      .notNull()
      .references(() => subcategory.id, { onDelete: "restrict" }),
    images: jsonb("images").notNull(),
});

export type Product = InferSelectModel<typeof product>;
export type NewProduct = InferInsertModel<typeof product>;