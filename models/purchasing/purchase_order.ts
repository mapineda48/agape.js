import { serial, integer, date, varchar } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import supplier from "./supplier";

const purchase_order = schema.table("purchasing_purchase_order", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => supplier.id),
  orderDate: date("order_date").defaultNow().notNull(), // fecha de la orden
  status: varchar("status", { length: 20 }).notNull(), // e.g. 'pending', 'received', 'cancelled'
});

export default purchase_order;
