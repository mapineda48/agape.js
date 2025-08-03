// Cartera por pagar (Accounts Payable)
// Relacionada con factura de compra
import { serial, integer, numeric } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import purchase_invoice from "./purchase_invoice";

const accounts_payable = schema.table("finance_accounts_payable", {
  id: serial("id").primaryKey(),
  purchaseInvoiceId: integer("purchase_invoice_id").notNull().references(() => purchase_invoice.id, { onDelete: "cascade" }),
  pendingAmount: numeric("pending_amount", { precision: 12, scale: 2 }).notNull(), // monto pendiente por pagar
});

export default accounts_payable;
