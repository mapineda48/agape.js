// inventory/item.ts
import { schema } from "../agape";
import {
  serial,
  varchar,
  boolean,
  smallint,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { category } from "./category";
import { subcategory } from "./subcategory";
import { decimal } from "../../lib/db/custom-types";

export const itemTypeEnum = schema.enum("inventory_item_type", [
  "good", // bien físico
  "service", // servicio
  "bundle", // kit / combo
  "charge", // cargo, fee, etc.
]);

/**
 * Maestro de ítems (Item)
 * Representa cualquier ítem vendible/comprable: producto, servicio, cargo, bundle, etc.
 */
export const item = schema.table(
  "inventory_item",
  {
    /** Identificador único del ítem */
    id: serial("id").primaryKey(),

    /** Código interno / SKU del ítem (único) */
    code: varchar("code", { length: 50 }).notNull(),

    /** Nombre completo del ítem */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Slogan del ítem (opcional) */
    slogan: varchar("slogan", { length: 80 }),

    /** Descripción del ítem */
    description: varchar("description", { length: 500 }),

    /** Tipo de ítem (producto, servicio, etc.) */
    itemType: itemTypeEnum("item_type").notNull(),

    /** Indica si el ítem está habilitado */
    isEnabled: boolean("is_enabled").notNull(),

    /** Calificación del ítem (para catálogo / UX) */
    rating: smallint("rating").notNull().default(0),

    /**
     * Precio base del ítem.
     * En un ERP grande normalmente se usan listas de precios,
     * pero este valor sirve como base/sugerido.
     */
    basePrice: decimal("base_price").notNull(),

    /** Categoría asociada (opcional) */
    categoryId: integer("category_id").references(() => category.id, {
      onDelete: "set null",
    }),

    /** Subcategoría asociada (opcional) */
    subcategoryId: integer("subcategory_id").references(() => subcategory.id, {
      onDelete: "set null",
    }),

    /** Imágenes del ítem en formato JSON */
    images: jsonb("images").notNull(),
  },
  (table) => [
    /** Código único de ítem */
    uniqueIndex("ux_inventory_item_code").on(table.code),
  ]
);

export type Item = InferSelectModel<typeof item>;
export type NewItem = InferInsertModel<typeof item>;
