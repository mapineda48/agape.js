import { schema } from "#models/agape";
import { serial, varchar, text, timestamp, boolean, } from "drizzle-orm/pg-core";

const role = schema.table("staff_role", {

    id: serial("id").primaryKey(),

    code: varchar("code", { length: 10 }).notNull(),

    name: varchar("name", { length: 100 }).notNull(),

    description: text("description"),

    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
        .defaultNow(),

    updateAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
});

export default role;