// Factura de venta (Sales Invoice)
// Relacionada con pedido (order)
import { serial, integer, date, numeric } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import order from "#models/crm/order";

const sales_invoice = schema.table("finance_sales_invoice", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => order.id),
  issueDate: date("issue_date").defaultNow().notNull(), // fecha de emisión de la factura
  dueDate: date("due_date"), // fecha de vencimiento de la factura
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(), // monto total de la factura
});

export default sales_invoice;
