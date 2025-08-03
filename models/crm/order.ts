import { serial, integer, date, varchar, boolean } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import client from "./client";
import order_type from "./order_type";


/**
 * Modelo de orden de cliente (Order)
 * Representa una orden realizada por un cliente.
 */
const order = schema.table("crm_order", {
  /** Identificador único de la orden */
  id: serial("id").primaryKey(),
  /** Identificador del cliente */
  clientId: integer("client_id").notNull().references(() => client.id),
  /** Identificador del tipo de orden */
  orderTypeId: integer("order_type_id").notNull().references(() => order_type.id),
  /** Fecha de la orden */
  orderDate: date("order_date").defaultNow().notNull(),
  /** Estado de la orden (ej: 'pending', 'shipped') */
  status: varchar("status", { length: 20 }).notNull(),
  /** Indica si la orden está deshabilitada */
  disabled: boolean("disabled").default(false).notNull(),
});

export default order;