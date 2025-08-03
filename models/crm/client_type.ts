
import { boolean, serial, varchar } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";

const client_type = schema.table("crm_client_type", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // e.g. 'Retail', 'Wholesale', 'VIP'
  disabled: boolean("disabled").default(false).notNull(),
});

export default client_type;