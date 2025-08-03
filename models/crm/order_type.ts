import { boolean, serial, varchar } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";

const order_type = schema.table("crm_order_type", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // e.g. 'Online', 'InStore', 'Wholesale'
  disabled: boolean("disabled").default(false).notNull(),
});

export default order_type;
