import { serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import person from "#models/core/person";
import client_type from "./client_type";

const client = schema.table("crm_client", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull().references(() => person.id).unique(),
  typeId: integer("type_id").references(() => client_type.id),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

export default client;
