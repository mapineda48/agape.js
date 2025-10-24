import { serial, integer, date, numeric } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import order from "../crm/order";

/**
 * Modelo de factura de venta (Sales Invoice)
 * Representa una factura emitida por una orden de cliente.
 */
const sales_invoice = schema.table("finance_sales_invoice", {
  /** Identificador único de la factura */
  id: serial("id").primaryKey(),
  /** Identificador de la orden relacionada */
  orderId: integer("order_id").notNull().references(() => order.id),
  /** Fecha de emisión de la factura */
  issueDate: date("issue_date").defaultNow().notNull(),
  /** Fecha de vencimiento de la factura */
  dueDate: date("due_date"),
  /** Monto total de la factura */
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
});

export default sales_invoice;
