import { serial, integer, date, varchar, boolean } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import client from "./client";
import order_type from "./order_type";

const order = schema.table("crm_order", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => client.id),
  orderTypeId: integer("order_type_id").notNull().references(() => order_type.id),
  orderDate: date("order_date").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).notNull(), // e.g. 'pending', 'shipped'
  disabled: boolean("disabled").default(false).notNull(),
});

export default order;