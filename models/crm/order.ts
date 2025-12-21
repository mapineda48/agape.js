import {
  serial,
  integer,
  bigint,
  date,
  boolean,
  varchar,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import {
  relations,
  sql,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import ctx from "../../lib/db/schema/ctx";
import {
  decimal,
  dateTime,
  type AddressSnapshot,
} from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import client from "./client";
import order_type from "./order_type";
import { documentSeries } from "../numbering/document_series";
import { userAddress } from "../core/address";
import { user } from "../core/user";
import { paymentTerms } from "../finance/payment_terms";
import { priceList } from "../catalogs/price_list";
import employee from "../hr/employee";

/**
 * Enum de estados de orden CRM.
 * Valores: pending (pendiente), confirmed (confirmado), shipped (enviado),
 * delivered (entregado), cancelled (cancelado).
 */
export const orderStatusEnum = ctx((schema) => schema.enum("crm_order_status", [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]));

/**
 * Modelo de orden de cliente (Order / Sales Order)
 *
 * Representa una orden de venta realizada por un cliente.
 * Este modelo incluye:
 * - Información documental (serie, número, tipo, estado)
 * - Información comercial (cliente, vendedor, lista de precios, condiciones de pago)
 * - Información logística (direcciones de envío/facturación, fechas de entrega)
 * - Totales calculados (subtotal, descuentos, impuestos, total)
 *
 * Las líneas de detalle se almacenan en la tabla relacionada `crm_order_item`.
 */
const order = ctx(({ table }) => table(
  "crm_order",
  {
    // ========================================================================
    // Identificación del documento
    // ========================================================================

    /** Identificador único de la orden */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    /** Identificador del tipo de orden */
    orderTypeId: integer("order_type_id")
      .notNull()
      .references(() => order_type.id),

    /** Fecha de la orden */
    orderDate: date("order_date").defaultNow().notNull(),

    /** Estado de la orden (usa enum para consistencia y validación) */
    status: orderStatusEnum("status").default("pending").notNull(),

    /** Indica si la orden está deshabilitada */
    disabled: boolean("disabled").default(false).notNull(),

    // ========================================================================
    // Información comercial (Partes involucradas)
    // ========================================================================

    /** Identificador del cliente */
    clientId: integer("client_id")
      .notNull()
      .references(() => client.id),

    /**
     * Vendedor/representante de ventas que atiende la orden.
     * Permite comisiones, seguimiento y reportes por vendedor.
     */
    salespersonId: integer("salesperson_id").references(() => employee.id, {
      onDelete: "set null",
    }),

    // ========================================================================
    // Condiciones comerciales
    // ========================================================================

    /**
     * Condiciones de pago aplicables a esta orden.
     * Determina cuándo vence el pago (contado, 30 días, etc.)
     * Puede heredarse del cliente con override a nivel de orden.
     */
    paymentTermsId: integer("payment_terms_id").references(
      () => paymentTerms.id,
      { onDelete: "set null" }
    ),

    /**
     * Lista de precios utilizada para esta orden.
     * Permite aplicar precios específicos (mayorista, retail, web, etc.)
     * Puede heredarse del cliente con override a nivel de orden.
     */
    priceListId: integer("price_list_id").references(() => priceList.id, {
      onDelete: "set null",
    }),

    // ========================================================================
    // Información logística
    // ========================================================================

    /**
     * Dirección de envío de la orden.
     * Referencia a la tabla pivote core_user_address para obtener una
     * dirección específica del cliente.
     */
    shippingAddressId: integer("shipping_address_id").references(
      () => userAddress.id,
      { onDelete: "set null" }
    ),

    /**
     * Dirección de facturación de la orden.
     * Puede diferir de la dirección de envío.
     */
    billingAddressId: integer("billing_address_id").references(
      () => userAddress.id,
      { onDelete: "set null" }
    ),

    // ========================================================================
    // Información Multimoneda
    // ========================================================================

    /**
     * Código de moneda de la transacción (ej: COP, USD, EUR).
     * Fundamental para operaciones internacionales.
     */
    currencyCode: varchar("currency_code", { length: 3 })
      .notNull()
      .default("COP"),

    /**
     * Tasa de cambio en el momento de la transacción.
     * Permite convertir a la moneda base del sistema para reportes.
     * Default 1.0 para moneda local.
     */
    exchangeRate: decimal("exchange_rate")
      .notNull()
      .default(sql`1`),

    // ========================================================================
    // Snapshots de Direcciones (Integridad Histórica)
    // ========================================================================

    /**
     * Snapshot de la dirección de envío al momento de la orden.
     * Preserva la dirección exacta incluso si el maestro de direcciones cambia.
     */
    shippingAddressSnapshot: jsonb(
      "shipping_address_snapshot"
    ).$type<AddressSnapshot>(),

    /**
     * Snapshot de la dirección de facturación al momento de la orden.
     * Preserva la dirección exacta incluso si el maestro de direcciones cambia.
     */
    billingAddressSnapshot: jsonb(
      "billing_address_snapshot"
    ).$type<AddressSnapshot>(),

    /** Método de entrega (ej: mensajería, correo, pickup, etc.) */
    deliveryMethod: varchar("delivery_method", { length: 50 }),

    /**
     * Fecha prometida de entrega.
     * Fecha que se comunica al cliente como compromiso de entrega.
     */
    promisedDeliveryDate: date("promised_delivery_date"),

    /**
     * Fecha real de entrega.
     * Se actualiza cuando el pedido es entregado efectivamente.
     */
    actualDeliveryDate: date("actual_delivery_date"),

    // ========================================================================
    // Totales
    // ========================================================================

    /**
     * Subtotal de la orden (suma de líneas antes de impuestos globales).
     * Este campo se calcula desde las líneas pero se persiste para
     * consultas rápidas y auditoría.
     */
    subtotal: decimal("subtotal")
      .notNull()
      .default(sql`0`),

    /**
     * Porcentaje de descuento global aplicado a toda la orden.
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
     * Monto total de impuestos de la orden.
     */
    taxAmount: decimal("tax_amount")
      .notNull()
      .default(sql`0`),

    /**
     * Total de la orden (subtotal - descuentos + impuestos).
     */
    total: decimal("total")
      .notNull()
      .default(sql`0`),

    // ========================================================================
    // Observaciones y auditoría
    // ========================================================================

    /** Notas internas sobre la orden */
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
    uniqueIndex("ux_crm_order_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_crm_order_series").on(table.seriesId),

    /** Índice para búsquedas por cliente */
    index("ix_crm_order_client").on(table.clientId),

    /** Índice para búsquedas por vendedor */
    index("ix_crm_order_salesperson").on(table.salespersonId),

    /** Índice para búsquedas por fecha */
    index("ix_crm_order_date").on(table.orderDate),

    /** Índice para búsquedas por estado */
    index("ix_crm_order_status").on(table.status),
  ]
));

// ============================================================================
// Relaciones
// ============================================================================

/**
 * Relaciones de Order:
 * - Pertenece a un cliente
 * - Tiene un tipo de orden
 * - Puede tener un vendedor asignado
 * - Puede tener direcciones de envío/facturación
 * - Puede tener condiciones de pago y lista de precios
 * - Tiene múltiples líneas de orden (orderItems)
 */
export const orderRelations = relations(order, ({ one, many }) => ({
  client: one(client, {
    fields: [order.clientId],
    references: [client.id],
  }),
  orderType: one(order_type, {
    fields: [order.orderTypeId],
    references: [order_type.id],
  }),
  salesperson: one(employee, {
    fields: [order.salespersonId],
    references: [employee.id],
  }),
  paymentTerms: one(paymentTerms, {
    fields: [order.paymentTermsId],
    references: [paymentTerms.id],
  }),
  priceList: one(priceList, {
    fields: [order.priceListId],
    references: [priceList.id],
  }),
  shippingAddress: one(userAddress, {
    fields: [order.shippingAddressId],
    references: [userAddress.id],
  }),
  billingAddress: one(userAddress, {
    fields: [order.billingAddressId],
    references: [userAddress.id],
  }),
  // La relación con orderItems se define en order_item.ts
}));

export type Order = InferSelectModel<typeof order>;
export type NewOrder = InferInsertModel<typeof order>;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export default order;
