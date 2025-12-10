import {
  serial,
  integer,
  bigint,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { schema } from "../agape";
import supplier from "../purchasing/supplier";
import { decimal } from "../../lib/db/custom-types";
import { documentSeries } from "../numbering/document_series";

/**
 * Modelo de factura de compra (Purchase Invoice)
 * Representa una factura emitida por un proveedor.
 */
const purchase_invoice = schema.table(
  "finance_purchase_invoice",
  {
    /** Identificador único de la factura */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    /** Identificador del proveedor relacionado */
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => supplier.id),

    /** Fecha de emisión de la factura */
    issueDate: date("issue_date").defaultNow().notNull(),

    /** Fecha de vencimiento de la factura */
    dueDate: date("due_date"),

    /** Monto total de la factura */
    totalAmount: decimal("total_amount").notNull(),
  },
  (table) => [
    /** Garantiza unicidad del número de documento dentro de la serie */
    uniqueIndex("ux_finance_purchase_invoice_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_finance_purchase_invoice_series").on(table.seriesId),
  ]
);

export type PurchaseInvoice = InferSelectModel<typeof purchase_invoice>;
export type NewPurchaseInvoice = InferInsertModel<typeof purchase_invoice>;

export default purchase_invoice;
