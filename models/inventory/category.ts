import { schema } from "#models/agape";
import { serial, varchar, boolean } from "drizzle-orm/pg-core";

export const category = schema.table("inventory_categories", {
  id: serial("id").primaryKey(),
  fullName: varchar("fullName", { length: 50 }).notNull(),
  isEnabled: boolean("isEnabled").notNull(),
});