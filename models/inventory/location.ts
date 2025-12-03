import { schema } from "../agape";
import { serial, varchar, boolean } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const location = schema.table("inventory_location", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  isEnabled: boolean("is_enabled").notNull(),
});

export type Location = InferSelectModel<typeof location>;
export type NewLocation = InferInsertModel<typeof location>;

export default location;
