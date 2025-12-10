import {
  serial,
  integer,
  bigint,
  date,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { schema } from "../agape";
import client from "./client";
import order_type from "./order_type";
import { documentSeries } from "../numbering/document_series";

/**
 * Enum de estados de orden CRM.
 * Valores: pending (pendiente), confirmed (confirmado), shipped (enviado),
 * delivered (entregado), cancelled (cancelado).
 */
export const orderStatusEnum = schema.enum("crm_order_status", [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

/**
 * Modelo de orden de cliente (Order)
 * Representa una orden realizada por un cliente.
 */
const order = schema.table(
  "crm_order",
  {
    /** Identificador único de la orden */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    /** Identificador del cliente */
    clientId: integer("client_id")
      .notNull()
      .references(() => client.id),

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
  },
  (table) => [
    /** Garantiza unicidad del número de documento dentro de la serie */
    uniqueIndex("ux_crm_order_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_crm_order_series").on(table.seriesId),
  ]
);

export type Order = InferSelectModel<typeof order>;
export type NewOrder = InferInsertModel<typeof order>;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export default order;
