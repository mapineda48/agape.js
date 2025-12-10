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
import order from "../crm/order";
import { decimal } from "../../lib/db/custom-types";
import { documentSeries } from "../numbering/document_series";

/**
 * Modelo de factura de venta (Sales Invoice)
 * Representa una factura emitida por una orden de cliente.
 */
const sales_invoice = schema.table(
  "finance_sales_invoice",
  {
    /** Identificador único de la factura */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    /** Identificador de la orden relacionada */
    orderId: integer("order_id")
      .notNull()
      .references(() => order.id),

    /** Fecha de emisión de la factura */
    issueDate: date("issue_date").defaultNow().notNull(),

    /** Fecha de vencimiento de la factura */
    dueDate: date("due_date"),

    /** Monto total de la factura */
    totalAmount: decimal("total_amount").notNull(),
  },
  (table) => [
    /** Garantiza unicidad del número de documento dentro de la serie */
    uniqueIndex("ux_finance_sales_invoice_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_finance_sales_invoice_series").on(table.seriesId),
  ]
);

export type SalesInvoice = InferSelectModel<typeof sales_invoice>;
export type NewSalesInvoice = InferInsertModel<typeof sales_invoice>;

export default sales_invoice;
