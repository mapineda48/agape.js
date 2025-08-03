import { serial, integer, timestamp, boolean, primaryKey, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { schema } from "#models/agape";
import person from "#models/core/person";
import role from "./role";

const employee = schema.table("staff_employee", {
    id: serial("id").primaryKey(),
    personId: integer("person_id").notNull().references(() => person.id).unique(),
    hireDate: timestamp("hire_date", { withTimezone: true }).defaultNow().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata"),
    avatarUrl: varchar("avatar_url", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date()),
});

// Pivot table for many-to-many relationship between employees and roles
export const employeeRole = schema.table("staff_employee_roles",
    {
        employeeId: integer("employee_id").notNull().references(() => employee.id),
        roleId: integer("role_id").notNull().references(() => role.id),
    },
    table => [primaryKey({ columns: [table.employeeId, table.roleId] })]
);


export const personRelations = relations(person, ({ one }) => ({
    employee: one(employee),
}));

export const roleRelations = relations(role, ({ many }) => ({
    employeeRoles: many(employeeRole),
}));

export const employeeRelations = relations(employee, ({ one, many }) => ({
    person: one(person, {
        fields: [employee.personId],
        references: [person.id],
    }),

    employeeRoles: many(employeeRole),
}));

export const employeeRoleRelations = relations(employeeRole, ({ one }) => ({
    person: one(employee, {
        fields: [employeeRole.employeeId],
        references: [employee.id],
    }),
    role: one(role, {
        fields: [employeeRole.roleId],
        references: [role.id],
    }),
}));

export default employee;