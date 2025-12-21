import ctx from "../../lib/db/schema/ctx";
import {
  serial,
  varchar,
  boolean,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { item } from "./item";
import { decimal } from "../../lib/db/custom-types";

/**
 * Variante de Ítem (Item Variant)
 *
 * Representa un SKU hijo que es una combinación específica de atributos
 * de un ítem padre (template).
 *
 * Ejemplo: Si el ítem padre es "Camiseta Básica", las variantes serían:
 * - "Camiseta Básica - Rojo - S" (código: CAM-001-RED-S)
 * - "Camiseta Básica - Rojo - M" (código: CAM-001-RED-M)
 * - "Camiseta Básica - Azul - S" (código: CAM-001-BLUE-S)
 *
 * Cada variante:
 * - Tiene su propio código/SKU único.
 * - Hereda propiedades del ítem padre.
 * - Puede tener precio y stock diferentes al padre.
 *
 * Los atributos específicos de cada variante se definen en
 * `catalogs_item_variant_attribute_value`.
 */
export const itemVariant = ctx(({ table }) => table(
  "catalogs_item_variant",
  {
    /** Identificador único de la variante */
    id: serial("id").primaryKey(),

    /** Ítem padre (template) del cual deriva esta variante */
    parentItemId: integer("parent_item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),

    /** Código/SKU único de la variante */
    code: varchar("code", { length: 50 }).notNull(),

    /** Nombre de la variante (generado o personalizado) */
    fullName: varchar("full_name", { length: 120 }).notNull(),

    /**
     * Precio adicional/modificador respecto al ítem padre.
     * Puede ser positivo (incremento) o negativo (descuento).
     * El precio final = padre.basePrice + variante.priceModifier
     */
    priceModifier: decimal("price_modifier").notNull(),

    /** Indica si la variante está habilitada */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Código único de variante */
    uniqueIndex("ux_catalogs_item_variant_code").on(table.code),
    /** Índice para búsqueda por ítem padre */
    index("ix_catalogs_item_variant_parent").on(table.parentItemId),
  ]
));

export type ItemVariant = InferSelectModel<typeof itemVariant>;
export type NewItemVariant = InferInsertModel<typeof itemVariant>;

export default itemVariant;
