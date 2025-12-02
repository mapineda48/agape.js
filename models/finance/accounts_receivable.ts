import { serial, integer } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import sales_invoice from "./sales_invoice";
import { decimal } from "../../lib/db/custom-types";

/**
 * Modelo de cartera por cobrar (Accounts Receivable)
 * Representa el monto pendiente por cobrar de una factura de venta.
 */
const accounts_receivable = schema.table("finance_accounts_receivable", {
  /** Identificador único de la cartera por cobrar */
  id: serial("id").primaryKey(),
  /** Identificador de la factura de venta relacionada */
  salesInvoiceId: integer("sales_invoice_id")
    .notNull()
    .references(() => sales_invoice.id, { onDelete: "cascade" }),
  /** Monto pendiente por cobrar */
  pendingAmount: decimal("pending_amount").notNull(),
});

export default accounts_receivable;
