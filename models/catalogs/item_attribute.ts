import { schema } from "../agape";
import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Atributo de Ítem (Item Attribute)
 *
 * Define los atributos disponibles para crear variantes de ítems.
 * Ejemplos: Color, Talla, Material, Capacidad, etc.
 *
 * Cada atributo puede tener múltiples valores definidos en `catalogs_item_attribute_value`.
 * Los atributos se combinan para crear variantes (SKUs hijos) en `catalogs_item_variant`.
 */
export const itemAttribute = schema.table(
  "catalogs_item_attribute",
  {
    /** Identificador único del atributo */
    id: serial("id").primaryKey(),

    /** Código interno del atributo (ej: COLOR, SIZE, MATERIAL) */
    code: varchar("code", { length: 20 }).notNull(),

    /** Nombre del atributo para mostrar */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Descripción del atributo */
    description: varchar("description", { length: 200 }),

    /** Indica si el atributo está habilitado */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Código único de atributo */
    uniqueIndex("ux_catalogs_item_attribute_code").on(table.code),
  ]
);

export type ItemAttribute = InferSelectModel<typeof itemAttribute>;
export type NewItemAttribute = InferInsertModel<typeof itemAttribute>;

export default itemAttribute;
