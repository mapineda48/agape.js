// Cartera por cobrar (Accounts Receivable)
// Relacionada con factura de venta
import { serial, integer, numeric } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import sales_invoice from "./sales_invoice";

const accounts_receivable = schema.table("finance_accounts_receivable", {
  id: serial("id").primaryKey(),
  salesInvoiceId: integer("sales_invoice_id").notNull().references(() => sales_invoice.id, { onDelete: "cascade" }),
  pendingAmount: numeric("pending_amount", { precision: 12, scale: 2 }).notNull(), // monto pendiente por cobrar
});

export default accounts_receivable;
