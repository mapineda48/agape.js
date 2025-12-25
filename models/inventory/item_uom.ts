import { schema } from "../schema";
import { serial, integer, uniqueIndex, boolean } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { inventoryItem } from "./item";
import { unitOfMeasure } from "./unit_of_measure";
import { decimal } from "../../lib/db/custom-types";

/**
 * Conversiones de Unidades de Medida por Ítem (Item UOM Conversion)
 *
 * Permite definir múltiplos/conversiones de UOM para cada ítem inventariable.
 * Ejemplo: para un ítem cuya UOM base es "Unidad":
 * - Caja = 12 unidades
 * - Pallet = 50 cajas = 600 unidades
 *
 * Esto permite vender en cajas y comprar en unidades, etc.
 */
export const itemUom = schema.table(
  "inventory_item_uom",
  {
    /** Identificador único de la conversión */
    id: serial("id").primaryKey(),

    /** Ítem inventariable al que aplica esta conversión */
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItem.itemId, { onDelete: "cascade" }),

    /** Unidad de medida alternativa */
    uomId: integer("uom_id")
      .notNull()
      .references(() => unitOfMeasure.id, { onDelete: "restrict" }),

    /**
     * Factor de conversión desde la UOM base del ítem.
     * Ejemplo: si UOM base es "Unidad" y esta UOM es "Caja",
     * y 1 Caja = 12 Unidades, entonces conversionFactor = 12
     */
    conversionFactor: decimal("conversion_factor").notNull(),

    /** Indica si esta conversión está habilitada */
    isEnabled: boolean("is_enabled").notNull().default(true),

    /** Indica si esta es la UOM preferida para compras */
    isDefaultPurchase: boolean("is_default_purchase").notNull().default(false),

    /** Indica si esta es la UOM preferida para ventas */
    isDefaultSales: boolean("is_default_sales").notNull().default(false),
  },
  (table) => [
    /** Un ítem solo puede tener una conversión por UOM */
    uniqueIndex("ux_inventory_item_uom_item_uom").on(table.itemId, table.uomId),
  ]
);

export type ItemUom = InferSelectModel<typeof itemUom>;
export type NewItemUom = InferInsertModel<typeof itemUom>;

export default itemUom;
