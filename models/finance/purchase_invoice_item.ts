import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import { serial, integer, index, varchar } from "drizzle-orm/pg-core";
import { schema } from "../schema";
import purchase_invoice from "./purchase_invoice";
import order_item from "../purchasing/order_item";
import goods_receipt_item from "../purchasing/goods_receipt_item";
import { item } from "../catalogs/item";
import { decimal } from "../../lib/db/custom-types";
import { tax } from "./tax";

/**
 * Líneas de Factura de Compra (Purchase Invoice Item)
 *
 * Cada línea representa un ítem facturado por el proveedor.
 * Puede vincularse a líneas de OC o de recepción (GRN) para conciliación automática.
 *
 * Flujo recomendado de vinculación:
 * - Factura basada en OC: invoice_item → order_item
 * - Factura basada en recepción: invoice_item → goods_receipt_item → order_item
 * - Factura sin documento previo: solo itemId, sin referencias
 *
  */
const purchase_invoice_item = schema.table(
  "finance_purchase_invoice_item",
  {
    /** Identificador único de la línea */
    id: serial("id").primaryKey(),

    /** FK a la factura de compra (header) */
    purchaseInvoiceId: integer("purchase_invoice_id")
      .notNull()
      .references(() => purchase_invoice.id, { onDelete: "cascade" }),

    /**
     * Línea de orden de compra de origen (opcional)
     * Permite vincular directamente a la OC sin pasar por GRN
     */
    orderItemId: integer("order_item_id").references(() => order_item.id, {
      onDelete: "restrict",
    }),

    /**
     * Línea de recepción de mercancía (opcional)
     * Vinculación preferida cuando se factura basado en lo recibido
     */
    goodsReceiptItemId: integer("goods_receipt_item_id").references(
      () => goods_receipt_item.id,
      { onDelete: "restrict" }
    ),

    /** Ítem facturado del catálogo */
    itemId: integer("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "restrict" }),

    /** Cantidad facturada */
    quantity: integer("quantity").notNull(),

    /** Precio unitario según factura del proveedor */
    unitPrice: decimal("unit_price").notNull(),

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

    /** Descripción adicional de la línea (puede diferir del nombre del ítem) */
    description: varchar("description", { length: 255 }),
  },
  (table) => [
    /** Índice para búsquedas por factura */
    index("ix_finance_pi_item_invoice").on(table.purchaseInvoiceId),

    /** Índice para conciliación con OC */
    index("ix_finance_pi_item_order_item").on(table.orderItemId),

    /** Índice para conciliación con GRN */
    index("ix_finance_pi_item_grn_item").on(table.goodsReceiptItemId),

    /** Índice para análisis de compras por ítem */
    index("ix_finance_pi_item_item").on(table.itemId),
  ]
);

export type PurchaseInvoiceItem = InferSelectModel<
  typeof purchase_invoice_item
>;
export type NewPurchaseInvoiceItem = InferInsertModel<
  typeof purchase_invoice_item
>;

export default purchase_invoice_item;
