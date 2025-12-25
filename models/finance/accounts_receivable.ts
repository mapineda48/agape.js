import { serial, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { schema } from "../schema";
import sales_invoice from "./sales_invoice";
import { decimal } from "../../lib/db/custom-types";

/**
 * Modelo de cartera por cobrar (Accounts Receivable)
 * Representa el monto pendiente por cobrar de una factura de venta.
 *
 * Relación 1:1 con sales_invoice: una factura tiene máximo una fila de cartera.
 * Si en el futuro necesitas manejar cuotas/abonos, crea una tabla de movimientos
 * de cobranza normalizada (1:N) y mantén pendingAmount como saldo consolidado.
 */
const accounts_receivable = schema.table(
  "finance_accounts_receivable",
  {
    /** Identificador único de la cartera por cobrar */
    id: serial("id").primaryKey(),

    /** Identificador de la factura de venta relacionada (única para relación 1:1) */
    salesInvoiceId: integer("sales_invoice_id")
      .notNull()
      .references(() => sales_invoice.id, { onDelete: "cascade" }),

    /** Monto pendiente por cobrar */
    pendingAmount: decimal("pending_amount").notNull(),
  },
  (table) => [
    /**
     * Restricción de unicidad: una factura solo puede tener una fila de cartera.
     * Esto implementa la relación 1:1 SalesInvoice ↔ AccountsReceivable.
     */
    uniqueIndex("ux_accounts_receivable_invoice").on(table.salesInvoiceId),
  ]
);

export default accounts_receivable;
