import { serial, integer, date, boolean } from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { schema } from "../agape";
import client from "./client";
import order_type from "./order_type";

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
const order = schema.table("crm_order", {
  /** Identificador único de la orden */
  id: serial("id").primaryKey(),

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
});

export type Order = InferSelectModel<typeof order>;
export type NewOrder = InferInsertModel<typeof order>;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export default order;
