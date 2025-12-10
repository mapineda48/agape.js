import { schema } from "../agape";
import { serial, integer, index } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { inventoryItem } from "./item";
import { location } from "./location";
import { inventoryLot } from "./lot";
import { decimal, dateTime } from "../../lib/db/custom-types";

/**
 * Capa de Costo de Inventario (Inventory Cost Layer)
 *
 * Tabla de capas para valoración de inventario por métodos FIFO/LIFO.
 * Cada registro representa una "capa" de costo que se crea al recibir
 * inventario y se consume al despachar.
 *
 * Métodos de valoración soportados:
 * - FIFO (First In, First Out): Se consume primero la capa más antigua
 * - LIFO (Last In, First Out): Se consume primero la capa más reciente
 * - Promedio ponderado: Se calcula promedio de todas las capas
 *
 * Ejemplo de flujo FIFO:
 * 1. Compra 100 unidades a $10 → Crea capa (qty=100, cost=$10)
 * 2. Compra 50 unidades a $12 → Crea capa (qty=50, cost=$12)
 * 3. Venta 80 unidades → Consume de capa 1 (remaining=20)
 * 4. Venta 30 unidades → Consume 20 de capa 1 + 10 de capa 2
 */
export const inventoryCostLayer = schema.table(
  "inventory_cost_layer",
  {
    id: serial("id").primaryKey(),

    /**
     * Ítem inventariable al que pertenece esta capa.
     */
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItem.itemId, { onDelete: "restrict" }),

    /**
     * Ubicación donde está el stock de esta capa.
     */
    locationId: integer("location_id")
      .notNull()
      .references(() => location.id, { onDelete: "restrict" }),

    /**
     * Lote asociado (opcional).
     * Si se usa trazabilidad por lotes, cada capa puede asociarse a un lote.
     */
    lotId: integer("lot_id").references(() => inventoryLot.id, {
      onDelete: "restrict",
    }),

    /**
     * Cantidad original de la capa al momento de creación.
     * No cambia después de creada.
     */
    originalQuantity: decimal("original_quantity").notNull(),

    /**
     * Cantidad restante disponible en la capa.
     * Se reduce conforme se consume el inventario.
     * Cuando llega a 0, la capa queda "agotada".
     */
    remainingQuantity: decimal("remaining_quantity").notNull(),

    /**
     * Costo unitario de esta capa.
     * Es el costo al que se adquirió esta cantidad específica.
     */
    unitCost: decimal("unit_cost").notNull(),

    /**
     * Fecha de creación de la capa (momento de entrada al inventario).
     * Usado para ordenar capas en FIFO/LIFO.
     */
    createdAt: dateTime("created_at").notNull(),

    /**
     * Referencia al movimiento de inventario que creó esta capa.
     * Permite auditoría completa.
     */
    sourceMovementId: integer("source_movement_id"),
  },
  (table) => [
    /** Índice compuesto para búsquedas de capas por ítem+ubicación */
    index("ix_inventory_cost_layer_item_location").on(
      table.itemId,
      table.locationId
    ),
    /** Índice para búsquedas por lote */
    index("ix_inventory_cost_layer_lot").on(table.lotId),
    /** Índice para ordenamiento FIFO/LIFO por fecha */
    index("ix_inventory_cost_layer_created").on(table.createdAt),
    /** Índice para encontrar capas con stock disponible */
    index("ix_inventory_cost_layer_remaining").on(table.remainingQuantity),
  ]
);

export type InventoryCostLayer = InferSelectModel<typeof inventoryCostLayer>;
export type NewInventoryCostLayer = InferInsertModel<typeof inventoryCostLayer>;

export default inventoryCostLayer;
