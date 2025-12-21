import { serial, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import ctx from "../../lib/db/schema/ctx";
import { decimal, dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import payment from "./payment";
import sales_invoice from "./sales_invoice";
import purchase_invoice from "./purchase_invoice";

/**
 * Asignación de Pago (Payment Allocation)
 *
 * Relaciona un pago (payment) con las facturas a las que se aplica.
 * Esto permite:
 * - Pagos parciales: Una factura puede tener múltiples asignaciones
 * - Pagos múltiples: Un pago puede aplicarse a varias facturas
 * - Trazabilidad: Saber exactamente cómo se distribuyó cada pago
 *
 * Reglas de negocio:
 * - Si el pago es tipo "receipt", debe tener salesInvoiceId (cobro a cliente)
 * - Si el pago es tipo "disbursement", debe tener purchaseInvoiceId (pago a proveedor)
 * - La suma de allocations de un pago no puede exceder payment.amount
 * - La suma de allocations de una factura no puede exceder invoice.totalAmount
 *
 * Al crear/modificar asignaciones, se debe actualizar:
 * - payment.unallocatedAmount
 * - accounts_receivable.pendingAmount o accounts_payable.pendingAmount
 *
 * @example
 * ```ts
 * // Asignación de cobro a factura de venta
 * {
 *   paymentId: 1,
 *   salesInvoiceId: 10,     // Factura de venta
 *   amount: "500.00"        // Monto aplicado
 * }
 *
 * // Asignación de pago a factura de compra
 * {
 *   paymentId: 2,
 *   purchaseInvoiceId: 5,   // Factura de compra
 *   amount: "750.00"        // Monto aplicado
 * }
 * ```
 */
const payment_allocation = ctx(({ table }) => table(
  "finance_payment_allocation",
  {
    /** Identificador único de la asignación */
    id: serial("id").primaryKey(),

    /** FK al pago */
    paymentId: integer("payment_id")
      .notNull()
      .references(() => payment.id, { onDelete: "cascade" }),

    /**
     * FK a la factura de venta (para cobros a clientes).
     * Mutuamente excluyente con purchaseInvoiceId.
     */
    salesInvoiceId: integer("sales_invoice_id").references(
      () => sales_invoice.id,
      { onDelete: "restrict" }
    ),

    /**
     * FK a la factura de compra (para pagos a proveedores).
     * Mutuamente excluyente con salesInvoiceId.
     */
    purchaseInvoiceId: integer("purchase_invoice_id").references(
      () => purchase_invoice.id,
      { onDelete: "restrict" }
    ),

    /** Monto asignado de este pago a esta factura */
    amount: decimal("amount").notNull(),

    /** Fecha de creación del registro */
    createdAt: dateTime("created_at")
      .default(sql`now()`)
      .notNull(),

    /** Fecha de última actualización del registro */
    updatedAt: dateTime("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    /** Índice para búsquedas por pago */
    index("ix_finance_payment_allocation_payment").on(table.paymentId),

    /** Índice para búsquedas por factura de venta */
    index("ix_finance_payment_allocation_sales_invoice").on(
      table.salesInvoiceId
    ),

    /** Índice para búsquedas por factura de compra */
    index("ix_finance_payment_allocation_purchase_invoice").on(
      table.purchaseInvoiceId
    ),

    /**
     * Garantiza que no se duplique la misma asignación pago-factura venta.
     * Un pago puede tener solo una asignación por factura de venta.
     */
    uniqueIndex("ux_finance_payment_allocation_sales").on(
      table.paymentId,
      table.salesInvoiceId
    ),

    /**
     * Garantiza que no se duplique la misma asignación pago-factura compra.
     * Un pago puede tener solo una asignación por factura de compra.
     */
    uniqueIndex("ux_finance_payment_allocation_purchase").on(
      table.paymentId,
      table.purchaseInvoiceId
    ),
  ]
));

export type PaymentAllocation = InferSelectModel<typeof payment_allocation>;
export type NewPaymentAllocation = InferInsertModel<typeof payment_allocation>;

export default payment_allocation;
