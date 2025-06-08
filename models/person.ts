import { serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";

// Independent Person table
const person = schema.table("person", {
    id: serial("id").primaryKey(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    birthdate: timestamp("birthdate", { withTimezone: true }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow(),
    updateAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
});

export default person;