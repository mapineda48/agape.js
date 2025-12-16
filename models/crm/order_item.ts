import schema from "../schema";
import {
  serial,
  integer,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  relations,
  sql,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import { decimal } from "../../lib/db/custom-types";
import order from "./order";
import { item } from "../catalogs/item";

/**
 * Línea de Orden de Venta (Order Item / Sales Order Line)
 *
 * Representa cada línea o ítem dentro de una orden de venta.
 * Este modelo es fundamental para:
 * - Detalle de productos/servicios vendidos por orden
 * - Explosión hacia movimientos de inventario
 * - Facturación parcial (si una orden se factura en varias partes)
 * - Reportes de ventas por producto
 * - Cálculo de totales, descuentos e impuestos por línea
 *
 * @example
 * ```ts
 * // Línea de orden: 10 unidades de producto X a $50 c/u con 10% de descuento
 * const orderItem = {
 *   orderId: 1,
 *   itemId: 100,
 *   lineNumber: 1,
 *   quantity: 10,
 *   unitPrice: 50.00,
 *   discountPercent: 10.00,
 *   taxPercent: 19.00,
 *   // subtotal = 10 * 50 = 500
 *   // descuento = 500 * 0.10 = 50
 *   // base imponible = 450
 *   // impuesto = 450 * 0.19 = 85.50
 *   // total = 535.50
 * };
 * ```
 */
export const orderItem = schema.table(
  "crm_order_item",
  {
    /** Identificador único de la línea */
    id: serial("id").primaryKey(),

    /** FK a la orden de venta padre */
    orderId: integer("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),

    /** FK al ítem del catálogo */
    itemId: integer("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "restrict" }),

    /**
     * Número de línea dentro de la orden.
     * Permite ordenar las líneas y facilita la referencia en documentos.
     */
    lineNumber: integer("line_number").notNull(),

    /**
     * Cantidad del ítem.
     * Usa decimal para soportar unidades fraccionarias (kg, litros, etc.)
     */
    quantity: decimal("quantity").notNull(),

    /**
     * Precio unitario del ítem en esta línea.
     * Puede diferir del basePrice del ítem por negociación, promoción, etc.
     */
    unitPrice: decimal("unit_price").notNull(),

    /**
     * Porcentaje de descuento aplicado a esta línea.
     * Ej: 10.00 = 10% de descuento
     */
    discountPercent: decimal("discount_percent")
      .notNull()
      .default(sql`0`),

    /**
     * Monto fijo de descuento (alternativo al porcentaje).
     * Permite descuentos como "$5 de descuento" en lugar de porcentaje.
     */
    discountAmount: decimal("discount_amount")
      .notNull()
      .default(sql`0`),

    /**
     * Porcentaje de impuesto aplicado a esta línea.
     * Se calcula sobre (quantity * unitPrice - descuentos).
     */
    taxPercent: decimal("tax_percent")
      .notNull()
      .default(sql`0`),

    /**
     * Monto de impuesto calculado para esta línea.
     * Se persiste para integridad y auditoría.
     */
    taxAmount: decimal("tax_amount")
      .notNull()
      .default(sql`0`),

    /**
     * Subtotal de la línea antes de impuestos.
     * = (quantity * unitPrice) - descuentos
     */
    subtotal: decimal("subtotal").notNull(),

    /**
     * Total de la línea incluyendo impuestos.
     * = subtotal + taxAmount
     */
    total: decimal("total").notNull(),

    /** Notas o comentarios específicos de esta línea */
    notes: varchar("notes", { length: 500 }),
  },
  (table) => [
    /** Índice para búsqueda por orden */
    index("ix_crm_order_item_order").on(table.orderId),

    /** Índice para búsqueda por ítem (reportes de ventas por producto) */
    index("ix_crm_order_item_item").on(table.itemId),

    /** Garantiza unicidad del número de línea dentro de la orden */
    uniqueIndex("ux_crm_order_item_line").on(table.orderId, table.lineNumber),
  ]
);

// ============================================================================
// Relaciones
// ============================================================================

/**
 * Relaciones de OrderItem:
 * - Pertenece a una orden
 * - Referencia a un ítem del catálogo
 */
export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  item: one(item, {
    fields: [orderItem.itemId],
    references: [item.id],
  }),
}));

// ============================================================================
// Types
// ============================================================================

export type OrderItem = InferSelectModel<typeof orderItem>;
export type NewOrderItem = InferInsertModel<typeof orderItem>;

export default orderItem;
