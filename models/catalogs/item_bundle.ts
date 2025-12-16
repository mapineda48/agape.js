import schema from "../schema";
import {
  serial,
  integer,
  uniqueIndex,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { item } from "./item";
import { decimal } from "../../lib/db/custom-types";

/**
 * Bundle / Kit de Ítems (Item Bundle)
 *
 * Define la composición de un ítem tipo "bundle" o "kit".
 * Un bundle es un ítem que agrupa otros ítems con cantidades específicas.
 *
 * Ejemplo: "Kit de Limpieza" (ítem padre) contiene:
 * - 1x Escoba
 * - 1x Recogedor
 * - 2x Paños de microfibra
 * - 1x Balde 10L
 *
 * Al vender el bundle, el sistema puede:
 * - Descontar stock de los componentes.
 * - Calcular costo basado en componentes.
 * - Aplicar precio especial vs. comprar por separado.
 *
 * Nota: El ítem padre debe ser de un tipo especial (podría agregarse
 * 'bundle' al enum itemTypeEnum en el futuro).
 */
export const itemBundle = schema.table(
  "catalogs_item_bundle",
  {
    /** Identificador único del registro de componente */
    id: serial("id").primaryKey(),

    /** Ítem padre (el bundle/kit) */
    bundleItemId: integer("bundle_item_id")
      .notNull()
      .references(() => item.id, { onDelete: "cascade" }),

    /** Ítem hijo (componente del bundle) */
    componentItemId: integer("component_item_id")
      .notNull()
      .references(() => item.id, { onDelete: "restrict" }),

    /** Cantidad del componente en el bundle */
    quantity: decimal("quantity").notNull(),

    /** Orden de presentación del componente */
    sortOrder: integer("sort_order").notNull().default(0),

    /** Indica si el componente está habilitado en el bundle */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Un bundle no puede tener el mismo componente dos veces */
    uniqueIndex("ux_catalogs_item_bundle_bundle_component").on(
      table.bundleItemId,
      table.componentItemId
    ),
    /** Índice para búsqueda por bundle padre */
    index("ix_catalogs_item_bundle_bundle").on(table.bundleItemId),
    /** Índice para búsqueda por componente (¿en qué bundles está este ítem?) */
    index("ix_catalogs_item_bundle_component").on(table.componentItemId),
  ]
);

export type ItemBundle = InferSelectModel<typeof itemBundle>;
export type NewItemBundle = InferInsertModel<typeof itemBundle>;

export default itemBundle;
