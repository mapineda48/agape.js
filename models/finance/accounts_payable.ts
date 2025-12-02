import { serial, integer } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import purchase_invoice from "./purchase_invoice";
import { decimal } from "../../lib/db/custom-types";

/**
 * Modelo de cartera por pagar (Accounts Payable)
 * Representa el monto pendiente por pagar de una factura de compra.
 */
const accounts_payable = schema.table("finance_accounts_payable", {
  /** Identificador único de la cartera por pagar */
  id: serial("id").primaryKey(),
  /** Identificador de la factura de compra relacionada */
  purchaseInvoiceId: integer("purchase_invoice_id")
    .notNull()
    .references(() => purchase_invoice.id, { onDelete: "cascade" }),
  /** Monto pendiente por pagar */
  pendingAmount: decimal("pending_amount").notNull(),
});

export default accounts_payable;
