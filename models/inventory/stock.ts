import { schema } from "../agape";
import { integer, primaryKey, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import inventoryItem from "./item";
import { location } from "./location";
import { inventoryLot } from "./lot";
import { decimal } from "../../lib/db/custom-types";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Tabla de Stock por Ítem, Ubicación y Lote (Inventory Stock)
 *
 * Almacena la cantidad disponible de cada ítem inventariable en cada
 * ubicación, opcionalmente desglosado por lote.
 *
 * Diseño con PK compuesto (item_id, location_id, lot_id) que permite:
 * - Control de stock por ubicación
 * - Trazabilidad por lotes
 * - Gestión de fechas de vencimiento por lote
 *
 * Nota sobre NULL en lot_id:
 * - En PostgreSQL, NULL es distinto de cualquier valor (incluido NULL)
 *   en constraints UNIQUE/PK
 * - Esto permite tener múltiples registros con lot_id = NULL
 * - Para ítem sin lotes, se debe crear un lote "default" o usar lot_id = 0
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
     * Lote asociado al stock (opcional).
     * Permite trazabilidad y control de vencimiento.
     * Si no se usan lotes, crear un lote "SIN LOTE" por ítem.
     */
    lotId: integer("lot_id").references(() => inventoryLot.id, {
      onDelete: "restrict",
    }),

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
     * El lotId no está en la PK para permitir NULL.
     */
    primaryKey({ columns: [table.itemId, table.locationId] }),
    /** Índice para búsquedas por lote */
    index("ix_inventory_stock_lot").on(table.lotId),
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
