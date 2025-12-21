import {
  serial,
  integer,
  bigint,
  date,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import ctx from "../../lib/db/schema/ctx";
import { decimal, dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import { documentSeries } from "../numbering/document_series";
import { user } from "../core/user";
import { paymentMethod } from "./payment_method";

/**
 * Enum de tipo de pago.
 * - receipt: Recibo de cobro (dinero que entra - cliente paga)
 * - disbursement: Desembolso (dinero que sale - pagamos a proveedor)
 */
export const paymentTypeEnum = ctx((schema) => schema.enum("finance_payment_type", [
  "receipt", // Cobro a cliente
  "disbursement", // Pago a proveedor
]));

/**
 * Enum de estado del pago.
 * - draft: Borrador, aún no aplicado
 * - posted: Aplicado/Contabilizado
 * - cancelled: Anulado
 */
export const paymentStatusEnum = ctx((schema) => schema.enum("finance_payment_status", [
  "draft",
  "posted",
  "cancelled",
]));

/**
 * Pago / Cobranza (Payment)
 *
 * Representa un documento de pago o cobranza.
 * - Tipo "receipt": Dinero recibido de un cliente
 * - Tipo "disbursement": Dinero pagado a un proveedor
 *
 * Cada pago puede aplicarse a una o más facturas mediante payment_allocation.
 * Esto permite:
 * - Pagos parciales de facturas
 * - Un solo pago aplicado a múltiples facturas
 * - Trazabilidad completa del flujo de dinero
 *
 * El campo `pendingAmount` en AR/AP se actualiza automáticamente
 * cuando se crean/modifican las asignaciones.
 *
 * @example
 * ```ts
 * // Recibo de cobro de cliente
 * {
 *   type: "receipt",
 *   userId: 100,           // ID del cliente (user)
 *   paymentMethodId: 1,     // Transferencia bancaria
 *   paymentDate: new Date(),
 *   amount: "1500.00",
 *   reference: "TRF-2024-001",
 *   status: "posted"
 * }
 * ```
 */
const payment = ctx(({ table }) => table(
  "finance_payment",
  {
    /** Identificador único del pago */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    /**
     * Tipo de pago:
     * - receipt: Cobro a cliente
     * - disbursement: Pago a proveedor
     */
    type: paymentTypeEnum("type").notNull(),

    /**
     * La contraparte del pago (cliente o proveedor).
     * Referencia a user porque tanto clientes como proveedores heredan de user.
     */
    userId: integer("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),

    /** Método de pago utilizado */
    paymentMethodId: integer("payment_method_id")
      .notNull()
      .references(() => paymentMethod.id, { onDelete: "restrict" }),

    /** Fecha del pago */
    paymentDate: date("payment_date").defaultNow().notNull(),

    /** Monto total del pago */
    amount: decimal("amount").notNull(),

    /** Código de moneda (ej: COP, USD) */
    currencyCode: varchar("currency_code", { length: 3 })
      .notNull()
      .default("COP"),

    /** Tasa de cambio (Default 1.0) */
    exchangeRate: decimal("exchange_rate")
      .notNull()
      .default(sql`1`),

    /**
     * Monto pendiente por asignar a facturas.
     * Inicialmente igual a amount, decrece con cada asignación.
     * Cuando llega a 0, el pago está completamente aplicado.
     */
    unallocatedAmount: decimal("unallocated_amount").notNull(),

    /**
     * Referencia o número de transacción.
     * Ej: Número de transferencia, número de cheque, etc.
     */
    reference: varchar("reference", { length: 100 }),

    /** Estado del pago */
    status: paymentStatusEnum("status").default("draft").notNull(),

    /** Notas internas sobre el pago */
    notes: varchar("notes", { length: 500 }),

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
    uniqueIndex("ux_finance_payment_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_finance_payment_series").on(table.seriesId),

    /** Índice para búsquedas por contraparte (cliente/proveedor) */
    index("ix_finance_payment_user").on(table.userId),

    /** Índice para búsquedas por tipo */
    index("ix_finance_payment_type").on(table.type),

    /** Índice para búsquedas por fecha */
    index("ix_finance_payment_date").on(table.paymentDate),

    /** Índice para búsquedas por estado */
    index("ix_finance_payment_status").on(table.status),
  ]
));

export type Payment = InferSelectModel<typeof payment>;
export type NewPayment = InferInsertModel<typeof payment>;
export type PaymentType = (typeof paymentTypeEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];

export default payment;
