import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import { serial, integer, index, varchar } from "drizzle-orm/pg-core";
import { schema } from "../schema";
import sales_invoice from "./sales_invoice";
import order_item from "../crm/order_item";
import { item } from "../catalogs/item";
import { decimal } from "../../lib/db/custom-types";
import { tax } from "./tax";

/**
 * Líneas de Factura de Venta (Sales Invoice Item)
 *
 * Cada línea representa un ítem facturado al cliente.
 * Puede vincularse a líneas de órdenes de venta para trazabilidad.
 *
 * Flujo de vinculación:
 * - Factura basada en orden: invoice_item → order_item
 * - Factura directa (sin orden previa): solo itemId, sin referencias
 *
  */
const sales_invoice_item = schema.table(
  "finance_sales_invoice_item",
  {
    /** Identificador único de la línea */
    id: serial("id").primaryKey(),

    /** FK a la factura de venta (header) */
    salesInvoiceId: integer("sales_invoice_id")
      .notNull()
      .references(() => sales_invoice.id, { onDelete: "cascade" }),

    /**
     * Línea de orden de venta de origen (opcional)
     * Permite vincular la factura a la orden para trazabilidad
     */
    orderItemId: integer("order_item_id").references(() => order_item.id, {
      onDelete: "restrict",
    }),

    /** Ítem facturado del catálogo */
    itemId: integer("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "restrict" }),

    /**
     * Número de línea dentro de la factura.
     * Permite ordenar las líneas y facilita la referencia en documentos.
     */
    lineNumber: integer("line_number").notNull(),

    /** Cantidad facturada */
    quantity: decimal("quantity").notNull(),

    /** Precio unitario según factura */
    unitPrice: decimal("unit_price").notNull(),

    /**
     * Porcentaje de descuento aplicado a esta línea.
     * Ej: 10.00 = 10% de descuento
     */
    discountPercent: decimal("discount_percent").default(sql`0`),

    /**
     * Descuento aplicado a la línea (monto, no porcentaje)
     * Default 0 si no hay descuento
     */
    discountAmount: decimal("discount_amount").default(sql`0`),

    /**
     * FK al impuesto aplicado (IVA, exento, etc.)
     * Referencia al catálogo de impuestos del sistema
     */
    taxId: integer("tax_id").references(() => tax.id, {
      onDelete: "restrict",
    }),

    /**
     * Monto de impuesto calculado para esta línea
     * Se guarda como snapshot para evitar recálculos si cambian tasas
     */
    taxAmount: decimal("tax_amount").default(sql`0`),

    /**
     * Subtotal de la línea: (quantity * unitPrice) - discountAmount
     * Calculado y almacenado para facilitar consultas
     */
    subtotal: decimal("subtotal").notNull(),

    /**
     * Total de la línea incluyendo impuestos.
     * = subtotal + taxAmount
     */
    total: decimal("total").notNull(),

    /** Descripción adicional de la línea (puede diferir del nombre del ítem) */
    description: varchar("description", { length: 255 }),
  },
  (table) => [
    /** Índice para búsquedas por factura */
    index("ix_finance_si_item_invoice").on(table.salesInvoiceId),

    /** Índice para conciliación con orden de venta */
    index("ix_finance_si_item_order_item").on(table.orderItemId),

    /** Índice para análisis de ventas por ítem */
    index("ix_finance_si_item_item").on(table.itemId),
  ]
);

export type SalesInvoiceItem = InferSelectModel<typeof sales_invoice_item>;
export type NewSalesInvoiceItem = InferInsertModel<typeof sales_invoice_item>;

export default sales_invoice_item;
