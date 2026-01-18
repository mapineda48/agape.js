import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import {
  serial,
  integer,
  bigint,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { schema } from "../schema";
import supplier from "./supplier";
import purchase_order from "./purchase_order";
import { dateTime } from "../../lib/db/custom-types";
import { documentSeries } from "../numbering/document_series";
import employee from "../hr/employee";
import DateTime from "../../lib/utils/data/DateTime";

export const goodsReceiptStatusEnum = schema.enum(
  "purchasing_goods_receipt_status",
  ["draft", "posted", "cancelled"]
);

/**
 * Documento de Recepción de Mercancía (Goods Receipt / GRN)
 *
 * Representa la recepción física de mercancía del proveedor.
 * Este documento es el puente entre la Orden de Compra y los movimientos de inventario.
 *
 * Flujo típico:
 * 1. Se crea OC (purchase_order)
 * 2. Llega la mercancía → se crea GRN (goods_receipt) referenciando la OC
 * 3. El GRN genera movimientos de inventario (inventory_movement)
 * 4. La factura de compra puede referenciar el GRN o la OC
 *
  */
const goods_receipt = schema.table(
  "purchasing_goods_receipt",
  {
    /** Identificador único del documento de recepción */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    /**
     * Orden de compra de origen (opcional para permitir recepciones sin OC)
     * La mayoría de GRN referencian una OC, pero en casos excepcionales
     * (devoluciones, ajustes) puede no haber OC.
     */
    purchaseOrderId: integer("purchase_order_id").references(
      () => purchase_order.id,
      { onDelete: "restrict" }
    ),

    /** Proveedor del cual se recibe la mercancía */
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => supplier.id, { onDelete: "restrict" }),

    /** Fecha de recepción de la mercancía */
    receiptDate: dateTime("receipt_date").notNull(),

    /** Estado del documento: draft (borrador), posted (contabilizado), cancelled */
    status: goodsReceiptStatusEnum("status").default("draft").notNull(),

    /** Observaciones o notas del documento */
    observation: varchar("observation", { length: 500 }),

    /** Usuario/empleado que registró la recepción */
    receivedByUserId: integer("received_by_user_id")
      .notNull()
      .references(() => employee.id, { onDelete: "restrict" }),

    /** Fecha de creación del registro */
    createdAt: dateTime("created_at")
      .default(sql`now()`)
      .notNull(),

    /** Fecha de última actualización del registro */
    updatedAt: dateTime("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    /** Garantiza unicidad del número de documento dentro de la serie */
    uniqueIndex("ux_purchasing_goods_receipt_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_purchasing_goods_receipt_series").on(table.seriesId),

    /** Índice para búsquedas por orden de compra */
    index("ix_purchasing_goods_receipt_po").on(table.purchaseOrderId),

    /** Índice para búsquedas por proveedor */
    index("ix_purchasing_goods_receipt_supplier").on(table.supplierId),
  ]
);

export type GoodsReceipt = InferSelectModel<typeof goods_receipt>;
export type NewGoodsReceipt = InferInsertModel<typeof goods_receipt>;
export type GoodsReceiptStatus =
  (typeof goodsReceiptStatusEnum.enumValues)[number];

export default goods_receipt;
