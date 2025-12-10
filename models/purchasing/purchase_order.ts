import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import {
  serial,
  integer,
  bigint,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { schema } from "../agape";
import supplier from "./supplier";
import { dateTime } from "../../lib/db/custom-types";
import { documentSeries } from "../numbering/document_series";

export const purchaseOrderStatusEnum = schema.enum(
  "purchasing_purchase_order_status",
  ["pending", "approved", "received", "cancelled"]
);

/**
 * Modelo de orden de compra (PurchaseOrder)
 * Representa una orden de compra realizada a un proveedor.
 */
const purchase_order = schema.table(
  "purchasing_purchase_order",
  {
    /** Identificador único de la orden de compra */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    /** Identificador del proveedor */
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => supplier.id),

    /** Fecha de la orden de compra */
    orderDate: dateTime("order_date").notNull(),

    /** Estado de la orden (ej: 'pending', 'received', 'cancelled') */
    status: purchaseOrderStatusEnum("status").default("pending").notNull(),
  },
  (table) => [
    /** Garantiza unicidad del número de documento dentro de la serie */
    uniqueIndex("ux_purchasing_order_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_purchasing_order_series").on(table.seriesId),
  ]
);

export type PurchaseOrder = InferSelectModel<typeof purchase_order>;
export type NewPurchaseOrder = InferInsertModel<typeof purchase_order>;
export type PurchaseOrderStatus =
  (typeof purchaseOrderStatusEnum.enumValues)[number];

export default purchase_order;
