import { schema } from "#models/agape";
import { serial, varchar, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import employee from "#models/staff/employee";

export const accessUser = schema.table("access_employee", {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id").notNull().references(() => employee.id),
    username: varchar("username", { length: 64 }).notNull().unique(),
    password: text("password_hash").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    lastLogin: timestamp("last_login", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updateAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
});

export const accessUserRelations = relations(accessUser, ({ one }) => ({
    employee: one(employee, {
        fields: [accessUser.employeeId],
        references: [employee.id],
    }),
}));

export default accessUser;