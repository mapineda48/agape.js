import { schema } from "../agape";
import { integer, primaryKey, index } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { itemVariant } from "./item_variant";
import { itemAttributeValue } from "./item_attribute_value";

/**
 * Valores de Atributos de Variante (Item Variant Attribute Value)
 *
 * Tabla pivote que define qué valores de atributos tiene cada variante.
 *
 * Ejemplo: Para la variante "Camiseta Básica - Rojo - M":
 * - variantId: (id de la variante)
 * - attributeValueId: (id del valor "Rojo" del atributo "Color")
 * - attributeValueId: (id del valor "M" del atributo "Talla")
 *
 * Esto permite:
 * - Definir variantes con cualquier combinación de atributos.
 * - Consultar variantes por atributos específicos.
 * - Generar filtros dinámicos en el catálogo.
 */
export const itemVariantAttributeValue = schema.table(
  "catalogs_item_variant_attribute_value",
  {
    /** Variante a la que pertenece esta combinación */
    variantId: integer("variant_id")
      .notNull()
      .references(() => itemVariant.id, { onDelete: "cascade" }),

    /** Valor de atributo asignado a esta variante */
    attributeValueId: integer("attribute_value_id")
      .notNull()
      .references(() => itemAttributeValue.id, { onDelete: "cascade" }),
  },
  (table) => [
    /** PK compuesta: una variante solo puede tener cada valor de atributo una vez */
    primaryKey({ columns: [table.variantId, table.attributeValueId] }),
    /** Índice para búsqueda por valor de atributo */
    index("ix_catalogs_item_variant_attr_value").on(table.attributeValueId),
  ]
);

export type ItemVariantAttributeValue = InferSelectModel<
  typeof itemVariantAttributeValue
>;
export type NewItemVariantAttributeValue = InferInsertModel<
  typeof itemVariantAttributeValue
>;

export default itemVariantAttributeValue;
