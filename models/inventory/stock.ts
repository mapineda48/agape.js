import { schema } from "../schema";
import { integer, primaryKey, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import inventoryItem from "./item";
import { location } from "./location";
import { decimal } from "../../lib/db/custom-types";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Tabla de Stock Agregado por Ubicación (Inventory Stock)
 *
 * Almacena la cantidad TOTAL de cada ítem inventariable en cada ubicación.
 * NO contiene detalle de lotes (para eso ver `inventory_stock_lot`).
 *
 * PK: (item_id, location_id)
 */
export const stock = schema.table(
  "inventory_stock",
  {
    /** Referencia al ítem maestro inventariable */
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItem.itemId, { onDelete: "restrict" }),

    /**
     * Ubicación (bodega/zona/bin).
     * NOT NULL para la PK compuesta.
     * Para stock sin ubicación específica, usar una ubicación "default".
     */
    locationId: integer("location_id")
      .notNull()
      .references(() => location.id, { onDelete: "restrict" }),

    /**
     * Cantidad disponible.
     * Usa decimal para soportar unidades fraccionarias (kg, litros, etc.).
     */
    quantity: decimal("quantity").notNull(),

    /**
     * Cantidad reservada (para órdenes pendientes).
     * Stock disponible real = quantity - reservedQuantity
     */
    reservedQuantity: decimal("reserved_quantity")
      .notNull()
      .default(sql`0`),
  },
  (table) => [
    /**
     * PK compuesto: garantiza unicidad de (item_id, location_id).
     */
    primaryKey({ columns: [table.itemId, table.locationId] }),
  ]
);

/**
 * Nota: Si se requiere stock desglosado por lote, considerar crear
 * una tabla separada `inventory_stock_lot` con PK (itemId, locationId, lotId)
 * para evitar problemas con NULL en PK.
 */

export type Stock = InferSelectModel<typeof stock>;
export type NewStock = InferInsertModel<typeof stock>;

export default stock;
