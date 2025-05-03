import { integer, varchar } from "drizzle-orm/pg-core";
import {schema} from "#models/agape"

export const usersTable = schema.table("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    age: integer().notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    email1: varchar({ length: 255 }).notNull().unique(),
});
