import {
  serial,
  integer,
  bigint,
  date,
  varchar,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import { schema } from "../agape";
import order from "../crm/order";
import client from "../crm/client";
import { user } from "../core/user";
import {
  decimal,
  dateTime,
  type AddressSnapshot,
} from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import { documentSeries } from "../numbering/document_series";
import { paymentTerms } from "./payment_terms";

/**
 * Enum de estado de factura de venta.
 * - draft: Borrador
 * - issued: Emitida
 * - partially_paid: Parcialmente pagada
 * - paid: Pagada completamente
 * - cancelled: Anulada
 */
export const salesInvoiceStatusEnum = schema.enum(
  "finance_sales_invoice_status",
  ["draft", "issued", "partially_paid", "paid", "cancelled"]
);

/**
 * Modelo de factura de venta (Sales Invoice)
 *
 * Representa una factura emitida a un cliente.
 *
 * Vinculaciones:
 * - Referencia directa al cliente (clientId)
 * - Puede referenciar una orden de venta (orderId) para facturación basada en pedido
 * - Incluye términos de pago (paymentTermsId) para calcular vencimiento
 *
 * Las líneas de detalle están en finance_sales_invoice_item.
 * Los cobros se registran en finance_payment con asignaciones en finance_payment_allocation.
 */
const sales_invoice = schema.table(
  "finance_sales_invoice",
  {
    // ========================================================================
    // Identificación del documento
    // ========================================================================

    /** Identificador único de la factura */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    // ========================================================================
    // Información comercial
    // ========================================================================

    /**
     * Cliente al que se emite la factura.
     * Referencia directa para independencia de la orden.
     */
    clientId: integer("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "restrict" }),

    /**
     * Orden de venta de referencia (opcional).
     * Útil cuando se factura contra un pedido.
     */
    orderId: integer("order_id").references(() => order.id, {
      onDelete: "restrict",
    }),

    /**
     * Términos de pago aplicables a esta factura.
     * Define el plazo para calcular la fecha de vencimiento.
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
     * Snapshot de dirección de envío.
     * Vital si la factura sirve como documento de despacho.
     */
    shippingAddressSnapshot: jsonb(
      "shipping_address_snapshot"
    ).$type<AddressSnapshot>(),

    /**
     * Snapshot de dirección de facturación (Fiscal).
     * CRÍTICO: Debe ser la dirección del cliente al momento de facturar.
     */
    billingAddressSnapshot: jsonb(
      "billing_address_snapshot"
    ).$type<AddressSnapshot>(),

    // ========================================================================
    // Fechas
    // ========================================================================

    /** Fecha de emisión de la factura */
    issueDate: date("issue_date").defaultNow().notNull(),

    /** Fecha de vencimiento de la factura (puede calcularse desde paymentTerms) */
    dueDate: date("due_date"),

    // ========================================================================
    // Totales
    // ========================================================================

    /**
     * Subtotal de la factura (suma de líneas antes de impuestos y descuentos globales).
     */
    subtotal: decimal("subtotal")
      .notNull()
      .default(sql`0`),

    /**
     * Porcentaje de descuento global aplicado a toda la factura.
     * Adicional a los descuentos por línea.
     */
    globalDiscountPercent: decimal("global_discount_percent")
      .notNull()
      .default(sql`0`),

    /**
     * Monto de descuento global aplicado.
     */
    globalDiscountAmount: decimal("global_discount_amount")
      .notNull()
      .default(sql`0`),

    /**
     * Monto total de impuestos de la factura.
     */
    taxAmount: decimal("tax_amount")
      .notNull()
      .default(sql`0`),

    /**
     * Total de la factura (subtotal - descuentos + impuestos).
     */
    totalAmount: decimal("total_amount").notNull(),

    // ========================================================================
    // Estado y observaciones
    // ========================================================================

    /** Estado de la factura */
    status: salesInvoiceStatusEnum("status").default("draft").notNull(),

    /** Notas internas sobre la factura */
    notes: varchar("notes", { length: 1000 }),

    /** Usuario que creó el registro */
    createdById: integer("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    /** Usuario que actualizó por última vez */
    updatedById: integer("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

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
    /** Garantiza unicidad del número de documento dentro de la serie */
    uniqueIndex("ux_finance_sales_invoice_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_finance_sales_invoice_series").on(table.seriesId),

    /** Índice para búsquedas por cliente */
    index("ix_finance_sales_invoice_client").on(table.clientId),

    /** Índice para búsquedas por orden */
    index("ix_finance_sales_invoice_order").on(table.orderId),

    /** Índice para búsquedas por fecha de emisión */
    index("ix_finance_sales_invoice_issue_date").on(table.issueDate),

    /** Índice para búsquedas por estado */
    index("ix_finance_sales_invoice_status").on(table.status),
  ]
);

export type SalesInvoice = InferSelectModel<typeof sales_invoice>;
export type NewSalesInvoice = InferInsertModel<typeof sales_invoice>;
export type SalesInvoiceStatus =
  (typeof salesInvoiceStatusEnum.enumValues)[number];

export default sales_invoice;
