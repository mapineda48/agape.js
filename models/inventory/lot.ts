import { schema } from "../agape";
import {
  serial,
  varchar,
  boolean,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { inventoryItem } from "./item";
import { dateTime } from "../../lib/db/custom-types";

/**
 * Lote de Inventario (Inventory Lot / Batch)
 *
 * Permite trazabilidad de productos mediante lotes/series.
 * Esencial para industrias reguladas: farmacéutica, alimentos, etc.
 *
 * Casos de uso:
 * - Trazabilidad de productos
 * - Control de fechas de vencimiento
 * - Gestión FIFO basada en lotes
 * - Recalls de productos
 */
export const inventoryLot = schema.table(
  "inventory_lot",
  {
    id: serial("id").primaryKey(),

    /**
     * Ítem inventariable al que pertenece este lote.
     * Un ítem puede tener múltiples lotes.
     */
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItem.itemId, { onDelete: "restrict" }),

    /**
     * Número de lote asignado.
     * Puede ser interno o provenir del proveedor.
     */
    lotNumber: varchar("lot_number", { length: 50 }).notNull(),

    /**
     * Número de serie (opcional).
     * Para productos con serialización individual.
     */
    serialNumber: varchar("serial_number", { length: 50 }),

    /**
     * Fecha de manufactura (opcional).
     * Cuando se fabricó el lote.
     */
    manufacturingDate: dateTime("manufacturing_date"),

    /**
     * Fecha de vencimiento (opcional).
     * Crítico para productos perecederos.
     */
    expirationDate: dateTime("expiration_date"),

    /**
     * Fecha de ingreso al inventario.
     * Cuándo se recibió el lote.
     */
    receivedDate: dateTime("received_date").notNull(),

    /**
     * Referencia al documento de origen (ej: orden de compra).
     */
    sourceDocumentType: varchar("source_document_type", { length: 30 }),
    sourceDocumentId: integer("source_document_id"),

    /**
     * Notas adicionales sobre el lote.
     */
    notes: varchar("notes", { length: 500 }),

    /**
     * Estado del lote: activo, bloqueado, cuarentena, agotado.
     */
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),

    /** Indica si el lote está habilitado para movimientos */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Número de lote único por ítem */
    uniqueIndex("ux_inventory_lot_item_lot").on(table.itemId, table.lotNumber),
    /** Índice para búsquedas por número de lote */
    index("ix_inventory_lot_number").on(table.lotNumber),
    /** Índice para filtrar por fecha de vencimiento */
    index("ix_inventory_lot_expiration").on(table.expirationDate),
    /** Índice para filtrar por estado */
    index("ix_inventory_lot_status").on(table.status),
  ]
);

/**
 * Estados posibles de un lote:
 * - ACTIVE: Disponible para uso
 * - QUARANTINE: En cuarentena, pendiente de inspección
 * - BLOCKED: Bloqueado, no disponible para uso
 * - EXHAUSTED: Agotado, sin stock remanente
 */
export type LotStatus = "ACTIVE" | "QUARANTINE" | "BLOCKED" | "EXHAUSTED";

export type InventoryLot = InferSelectModel<typeof inventoryLot>;
export type NewInventoryLot = InferInsertModel<typeof inventoryLot>;

export default inventoryLot;
