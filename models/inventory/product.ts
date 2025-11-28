import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  serial,
  varchar,
  boolean,
  smallint,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { schema } from "../agape";
import { category } from "./category";
import { subcategory } from "./subcategory";
import { decimal } from "../../lib/db/custom-types";

/**
 * Modelo de producto de inventario (Product)
 * Representa un producto dentro del catálogo de inventario.
 */
export const product = schema.table("inventory_product", {
  /** Identificador único del producto */
  id: serial("id").primaryKey(),
  /** Nombre completo del producto */
  fullName: varchar("full_name", { length: 80 }).notNull(),
  /** Slogan del producto */
  slogan: varchar("slogan", { length: 80 }).notNull(),
  /** Descripción del producto */
  description: varchar("description", { length: 500 }),
  /** Indica si el producto está activo */
  isActive: boolean("is_active").notNull(),
  /** Calificación del producto */
  rating: smallint("rating").notNull(),
  /** Precio del producto */
  price: decimal("price").notNull(),
  /** Identificador de la categoría asociada */
  categoryId: integer("category_id")
    .notNull()
    .references(() => category.id, { onDelete: "restrict" }),
  /** Identificador de la subcategoría asociada */
  subcategoryId: integer("subcategory_id")
    .notNull()
    .references(() => subcategory.id, { onDelete: "restrict" }),
  /** Imágenes del producto en formato JSON */
  images: jsonb("images").notNull(),
});

export type Product = InferSelectModel<typeof product>;
export type NewProduct = InferInsertModel<typeof product>;

export default product;
