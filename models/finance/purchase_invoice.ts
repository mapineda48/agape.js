// Factura de compra (Purchase Invoice)
// Relacionada con proveedor (persona)
import { serial, integer, date, numeric } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import supplier from "#models/purchasing/supplier";

const purchase_invoice = schema.table("finance_purchase_invoice", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => supplier.id),
  issueDate: date("issue_date").defaultNow().notNull(), // fecha de emisión de la factura
  dueDate: date("due_date"), // fecha de vencimiento de la factura
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(), // monto total de la factura
});

export default purchase_invoice;
