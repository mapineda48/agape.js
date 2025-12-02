import { serial, integer, date } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import supplier from "../purchasing/supplier";
import { decimal } from "../../lib/db/custom-types";

/**
 * Modelo de factura de compra (Purchase Invoice)
 * Representa una factura emitida por un proveedor.
 */
const purchase_invoice = schema.table("finance_purchase_invoice", {
  /** Identificador único de la factura */
  id: serial("id").primaryKey(),
  /** Identificador del proveedor relacionado */
  supplierId: integer("supplier_id")
    .notNull()
    .references(() => supplier.id),
  /** Fecha de emisión de la factura */
  issueDate: date("issue_date").defaultNow().notNull(),
  /** Fecha de vencimiento de la factura */
  dueDate: date("due_date"),
  /** Monto total de la factura */
  totalAmount: decimal("total_amount").notNull(),
});

export default purchase_invoice;
