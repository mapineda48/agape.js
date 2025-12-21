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
import { itemAttribute } from "./item_attribute";

/**
 * Valor de Atributo de Ítem (Item Attribute Value)
 *
 * Define los valores posibles para cada atributo.
 * Ejemplos:
 * - Para atributo "Color": Rojo, Azul, Verde, Negro, Blanco
 * - Para atributo "Talla": XS, S, M, L, XL, XXL
 * - Para atributo "Material": Algodón, Poliéster, Lana
 *
 * Estos valores se usan para definir las variantes de un ítem.
 */
export const itemAttributeValue = ctx(({ table }) => table(
  "catalogs_item_attribute_value",
  {
    /** Identificador único del valor de atributo */
    id: serial("id").primaryKey(),

    /** Atributo al que pertenece este valor */
    attributeId: integer("attribute_id")
      .notNull()
      .references(() => itemAttribute.id, { onDelete: "cascade" }),

    /** Código interno del valor (ej: RED, BLUE, S, M, L) */
    code: varchar("code", { length: 20 }).notNull(),

    /** Nombre del valor para mostrar (ej: "Rojo", "Azul", "Pequeño") */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Valor adicional para display (ej: código hex para colores "#FF0000") */
    displayValue: varchar("display_value", { length: 50 }),

    /** Orden de presentación dentro del atributo */
    sortOrder: integer("sort_order").notNull().default(0),

    /** Indica si el valor está habilitado */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Un atributo no puede tener valores con el mismo código */
    uniqueIndex("ux_catalogs_item_attribute_value_attr_code").on(
      table.attributeId,
      table.code
    ),
    /** Índice para búsqueda por atributo */
    index("ix_catalogs_item_attribute_value_attr").on(table.attributeId),
  ]
));

export type ItemAttributeValue = InferSelectModel<typeof itemAttributeValue>;
export type NewItemAttributeValue = InferInsertModel<typeof itemAttributeValue>;

export default itemAttributeValue;
