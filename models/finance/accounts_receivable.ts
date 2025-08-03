
import { serial, integer, numeric } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import sales_invoice from "./sales_invoice";

/**
 * Modelo de cartera por cobrar (Accounts Receivable)
 * Representa el monto pendiente por cobrar de una factura de venta.
 */
const accounts_receivable = schema.table("finance_accounts_receivable", {
  /** Identificador único de la cartera por cobrar */
  id: serial("id").primaryKey(),
  /** Identificador de la factura de venta relacionada */
  salesInvoiceId: integer("sales_invoice_id").notNull().references(() => sales_invoice.id, { onDelete: "cascade" }),
  /** Monto pendiente por cobrar */
  pendingAmount: numeric("pending_amount", { precision: 12, scale: 2 }).notNull(),
});

export default accounts_receivable;
