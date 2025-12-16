import { serial, integer, uniqueIndex } from "drizzle-orm/pg-core";
import schema from "../schema";
import purchase_invoice from "./purchase_invoice";
import { decimal } from "../../lib/db/custom-types";

/**
 * Modelo de cartera por pagar (Accounts Payable)
 * Representa el monto pendiente por pagar de una factura de compra.
 *
 * Relación 1:1 con purchase_invoice: una factura tiene máximo una fila de cartera.
 * Si en el futuro necesitas manejar cuotas/abonos, crea una tabla de movimientos
 * de pago normalizada (1:N) y mantén pendingAmount como saldo consolidado.
 */
const accounts_payable = schema.table(
  "finance_accounts_payable",
  {
    /** Identificador único de la cartera por pagar */
    id: serial("id").primaryKey(),

    /** Identificador de la factura de compra relacionada (única para relación 1:1) */
    purchaseInvoiceId: integer("purchase_invoice_id")
      .notNull()
      .references(() => purchase_invoice.id, { onDelete: "cascade" }),

    /** Monto pendiente por pagar */
    pendingAmount: decimal("pending_amount").notNull(),
  },
  (table) => [
    /**
     * Restricción de unicidad: una factura solo puede tener una fila de cartera.
     * Esto implementa la relación 1:1 PurchaseInvoice ↔ AccountsPayable.
     */
    uniqueIndex("ux_accounts_payable_invoice").on(table.purchaseInvoiceId),
  ]
);

export default accounts_payable;
