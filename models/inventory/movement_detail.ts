import schema from "../schema";
import { serial, integer, index } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { inventoryMovement } from "./movement";
import { item } from "../catalogs/item";
import { location } from "./location";
import { inventoryLot } from "./lot";
import { decimal } from "../../lib/db/custom-types";

/**
 * Detalle de Movimiento de Inventario (Inventory Movement Detail)
 *
 * Registra cada línea de un movimiento de inventario, incluyendo:
 * - Qué ítem se movió
 * - En qué ubicación
 * - Qué cantidad
 * - A qué costo
 * - De qué lote (para trazabilidad)
 */
export const inventoryMovementDetail = schema.table(
  "inventory_movement_detail",
  {
    id: serial("id").primaryKey(),

    movementId: integer("movement_id")
      .notNull()
      .references(() => inventoryMovement.id, { onDelete: "cascade" }),

    /**
     * Ítem afectado.
     * Debe ser inventariable según reglas de negocio (validar en servicio).
     */
    itemId: integer("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "restrict" }),

    /**
     * Ubicación (bodega/zona/bin).
     * Para entradas: ubicación destino.
     * Para salidas: ubicación origen.
     */
    locationId: integer("location_id").references(() => location.id, {
      onDelete: "restrict",
    }),

    /**
     * Lote asociado al movimiento (opcional).
     * Permite trazabilidad completa del inventario.
     * Crítico para productos con fecha de vencimiento.
     */
    lotId: integer("lot_id").references(() => inventoryLot.id, {
      onDelete: "restrict",
    }),

    /**
     * Cantidad movida.
     * Usa decimal para soportar unidades fraccionarias (kg, litros, etc.).
     * Siempre es positiva; la dirección la da el factor del tipo de movimiento.
     */
    quantity: decimal("quantity").notNull(),

    /**
     * Costo unitario en el momento del movimiento.
     * Se guarda como snapshot para auditoría y valoración.
     */
    unitCost: decimal("unit_cost"),

    /**
     * Costo total de la línea (quantity * unitCost).
     * Calculado y guardado para facilitar reportes.
     */
    totalCost: decimal("total_cost"),
  },
  (table) => [
    /** Índice para consultas por ítem */
    index("ix_inventory_movement_detail_item").on(table.itemId),
    /** Índice para consultas por ubicación */
    index("ix_inventory_movement_detail_location").on(table.locationId),
    /** Índice para consultas por lote */
    index("ix_inventory_movement_detail_lot").on(table.lotId),
  ]
);

export type InventoryMovementDetail = InferSelectModel<
  typeof inventoryMovementDetail
>;
export type NewInventoryMovementDetail = InferInsertModel<
  typeof inventoryMovementDetail
>;
