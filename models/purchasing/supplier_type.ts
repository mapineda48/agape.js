import { serial, varchar } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";

const supplier_type = schema.table("purchasing_supplier_type", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
});

export default supplier_type;
