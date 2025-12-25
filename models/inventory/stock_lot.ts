import { schema } from "../schema";
import { integer, primaryKey, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import inventoryItem from "./item";
import { location } from "./location";
import { inventoryLot } from "./lot";
import { decimal } from "../../lib/db/custom-types";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Tabla de Stock por Lote (Inventory Stock Lot)
 *
 * Almacena el detalle del stock desglosado por lote específico.
 * Complementa a la tabla `inventory_stock` (que guarda el agregado por ubicación).
 *
 * Estructura:
 * - itemId + locationId + lotId (PK)
 *
 * Esta separación permite:
 * 1. Tener múltiples lotes del mismo ítem en la misma ubicación.
 * 2. Evitar problemas con NULLs en PKs (lotId siempre debe tener valor aquí).
 * 3. Trazabilidad exacta de qué lotes están en qué bodega.
 */
export const stockLot = schema.table(
  "inventory_stock_lot",
  {
    /** Referencia al ítem maestro inventariable */
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItem.itemId, { onDelete: "restrict" }),

    /** Ubicación donde está el lote */
    locationId: integer("location_id")
      .notNull()
      .references(() => location.id, { onDelete: "restrict" }),

    /**
     * Identificador del lote.
     * Si un ítem no maneja lotes a nivel de sistema pero se guarda aquí,
     * debería referencias un lote "dummy" o tener una lógica específica.
     * Sin embargo, típicamente esta tabla solo contiene registros para ítems con lotes.
     */
    lotId: integer("lot_id")
      .notNull()
      .references(() => inventoryLot.id, { onDelete: "restrict" }),

    /** Cantidad disponible de este lote en esta ubicación */
    quantity: decimal("quantity").notNull(),

    /** Cantidad reservada de este lote */
    reservedQuantity: decimal("reserved_quantity")
      .notNull()
      .default(sql`0`),
  },
  (table) => [
    /**
     * PK compuesta de 3 niveles.
     * Un mismo lote podría estar en múltiples ubicaciones (aunque raro, es posible mover cajas).
     * Un ítem en una ubicación puede tener múltiples lotes.
     */
    primaryKey({ columns: [table.itemId, table.locationId, table.lotId] }),

    /** Índice para búsquedas rápidas por lote (¿dónde está este lote?) */
    index("ix_inventory_stock_lot_lot").on(table.lotId),

    /** Índice para consultar todo el stock de un ítem */
    index("ix_inventory_stock_lot_item").on(table.itemId),

    /** Índice para consultar stock por ubicación */
    index("ix_inventory_stock_lot_location").on(table.locationId),
  ]
);

export type StockLot = InferSelectModel<typeof stockLot>;
export type NewStockLot = InferInsertModel<typeof stockLot>;

export default stockLot;
