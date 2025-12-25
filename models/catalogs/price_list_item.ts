import { schema } from "../schema";
import { serial, integer, uniqueIndex, index } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { item } from "./item";
import { priceList } from "./price_list";
import { decimal, dateTime } from "../../lib/db/custom-types";

/**
 * Precio de Ítem por Lista (Price List Item)
 *
 * Relaciona cada ítem del catálogo con las diferentes listas de precios,
 * permitiendo definir precios específicos y fechas de vigencia.
 *
 * Esto permite:
 * - Tener un precio "Mayorista" diferente al "Retail"
 * - Definir precios promocionales con fecha de inicio/fin
 * - Mantener historial de precios por vigencia
 */
export const priceListItem = schema.table(
  "catalogs_price_list_item",
  {
    /** Identificador único del registro */
    id: serial("id").primaryKey(),

    /** Lista de precios a la que pertenece este precio */
    priceListId: integer("price_list_id")
      .notNull()
      .references(() => priceList.id, { onDelete: "cascade" }),

    /** Ítem del catálogo */
    itemId: integer("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),

    /** Precio del ítem en esta lista */
    price: decimal("price").notNull(),

    /** Fecha desde la cual aplica este precio (null = sin restricción de inicio) */
    validFrom: dateTime("valid_from"),

    /** Fecha hasta la cual aplica este precio (null = sin restricción de fin) */
    validTo: dateTime("valid_to"),
  },
  (table) => [
    /** Un ítem solo puede tener un precio por lista de precios con la misma vigencia */
    uniqueIndex("ux_catalogs_price_list_item_unique").on(
      table.priceListId,
      table.itemId,
      table.validFrom,
      table.validTo
    ),
    /** Índice para búsqueda rápida por ítem */
    index("ix_catalogs_price_list_item_item").on(table.itemId),
    /** Índice para búsqueda rápida por lista */
    index("ix_catalogs_price_list_item_list").on(table.priceListId),
  ]
);

export type PriceListItem = InferSelectModel<typeof priceListItem>;
export type NewPriceListItem = InferInsertModel<typeof priceListItem>;

export default priceListItem;
