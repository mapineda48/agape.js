import {
  serial,
  integer,
  bigint,
  date,
  uniqueIndex,
  jsonb,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import { schema } from "../schema";
import supplier from "../purchasing/supplier";
import purchase_order from "../purchasing/purchase_order";
import goods_receipt from "../purchasing/goods_receipt";
import { user } from "../core/user";
import { decimal, type AddressSnapshot } from "../../lib/db/custom-types";
import { documentSeries } from "../numbering/document_series";
import { paymentTerms } from "./payment_terms";

/**
 * Modelo de factura de compra (Purchase Invoice)
 * Representa una factura emitida por un proveedor.
 *
 * Vinculaciones:
 * - Puede referenciar una OC (purchaseOrderId) para facturación directa
 * - Puede referenciar un GRN (goodsReceiptId) para facturación basada en recepción
 * - Incluye términos de pago (paymentTermsId) para calcular vencimiento
 *
 * Las líneas de detalle están en finance_purchase_invoice_item
 */
const purchase_invoice = schema.table(
  "finance_purchase_invoice",
  {
    /** Identificador único de la factura */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    /** Identificador del proveedor relacionado */
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => supplier.id),

    /**
     * Orden de compra de referencia (opcional)
     * Útil cuando se factura directamente contra una OC
     */
    purchaseOrderId: integer("purchase_order_id").references(
      () => purchase_order.id,
      { onDelete: "restrict" }
    ),

    /**
     * Documento de recepción de referencia (opcional)
     * Flujo preferido: OC → GRN → Factura
     */
    goodsReceiptId: integer("goods_receipt_id").references(
      () => goods_receipt.id,
      { onDelete: "restrict" }
    ),

    /**
     * Términos de pago aplicables a esta factura
     * Define el plazo para calcular la fecha de vencimiento
     */
    paymentTermsId: integer("payment_terms_id").references(
      () => paymentTerms.id,
      { onDelete: "restrict" }
    ),

    // ========================================================================
    // Información Multimoneda
    // ========================================================================

    /** Código de moneda (ej: COP, USD) */
    currencyCode: varchar("currency_code", { length: 3 })
      .notNull()
      .default("COP"),

    /** Tasa de cambio (Default 1.0) */
    exchangeRate: decimal("exchange_rate")
      .notNull()
      .default(sql`1`),

    // ========================================================================
    // Snapshots de Direcciones
    // ========================================================================

    /**
     * Snapshot de la dirección del proveedor.
     * Importante para validar obligaciones fiscales y retenciones.
     */
    supplierAddressSnapshot: jsonb(
      "supplier_address_snapshot"
    ).$type<AddressSnapshot>(),

    /** Fecha de emisión de la factura */
    issueDate: date("issue_date").defaultNow().notNull(),

    /** Fecha de vencimiento de la factura (puede calcularse desde paymentTerms) */
    dueDate: date("due_date"),

    /** Monto total de la factura */
    totalAmount: decimal("total_amount").notNull(),

    /** Usuario que creó el registro */
    createdById: integer("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    /** Usuario que actualizó por última vez */
    updatedById: integer("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    /** Garantiza unicidad del número de documento dentro de la serie */
    uniqueIndex("ux_finance_purchase_invoice_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_finance_purchase_invoice_series").on(table.seriesId),
  ]
);

export type PurchaseInvoice = InferSelectModel<typeof purchase_invoice>;
export type NewPurchaseInvoice = InferInsertModel<typeof purchase_invoice>;

export default purchase_invoice;
