import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { serial, integer, index, varchar } from "drizzle-orm/pg-core";
import schema from "../schema";
import goods_receipt from "./goods_receipt";
import order_item from "./order_item";
import { item } from "../catalogs/item";
import { location } from "../inventory/location";
import { decimal } from "../../lib/db/custom-types";

/**
 * Líneas del Documento de Recepción de Mercancía (Goods Receipt Item)
 *
 * Cada línea representa un ítem recibido con su cantidad y ubicación destino.
 * Puede vincular a una línea de OC para trazabilidad completa.
 *
 * Características:
 * - Referencia opcional a order_item (para recepciones no vinculadas a OC)
 * - Soporta recepciones parciales (quantity puede ser menor a lo ordenado)
 * - Incluye ubicación destino en almacén
 * - Captura costo unitario al momento de recepción
 *
 * @example
 * ```ts
 * // Línea de recepción vinculada a OC
 * {
 *   goodsReceiptId: 1,
 *   orderItemId: 10,      // Línea de OC origen
 *   itemId: 100,
 *   quantity: 50,         // Recibidos (puede ser menor al pedido)
 *   locationId: 1,        // Bodega principal
 *   unitCost: "150.00"
 * }
 * ```
 */
const goods_receipt_item = schema.table(
  "purchasing_goods_receipt_item",
  {
    /** Identificador único de la línea */
    id: serial("id").primaryKey(),

    /** FK al documento de recepción (header) */
    goodsReceiptId: integer("goods_receipt_id")
      .notNull()
      .references(() => goods_receipt.id, { onDelete: "cascade" }),

    /**
     * Línea de orden de compra de origen (opcional)
     * Permite trazabilidad OC → GRN y facilita conciliación de recepciones parciales
     */
    orderItemId: integer("order_item_id").references(() => order_item.id, {
      onDelete: "restrict",
    }),

    /** Ítem recibido del catálogo */
    itemId: integer("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "restrict" }),

    /** Cantidad recibida */
    quantity: integer("quantity").notNull(),

    /**
     * Ubicación/bodega destino donde se almacena la mercancía
     * Puede ser null si el sistema no maneja múltiples ubicaciones
     */
    locationId: integer("location_id").references(() => location.id, {
      onDelete: "restrict",
    }),

    /** Costo unitario al momento de la recepción */
    unitCost: decimal("unit_cost").notNull(),

    /**
     * Número de lote (opcional)
     * Útil para trazabilidad de productos con vencimiento o control de calidad
     */
    lotNumber: varchar("lot_number", { length: 50 }),

    /** Observaciones específicas de la línea */
    observation: varchar("observation", { length: 255 }),
  },
  (table) => [
    /** Índice para búsquedas por documento de recepción */
    index("ix_purchasing_grn_item_receipt").on(table.goodsReceiptId),

    /** Índice para trazabilidad desde línea de OC */
    index("ix_purchasing_grn_item_order_item").on(table.orderItemId),

    /** Índice para consultas de recepción por ítem */
    index("ix_purchasing_grn_item_item").on(table.itemId),
  ]
);

export type GoodsReceiptItem = InferSelectModel<typeof goods_receipt_item>;
export type NewGoodsReceiptItem = InferInsertModel<typeof goods_receipt_item>;

export default goods_receipt_item;
