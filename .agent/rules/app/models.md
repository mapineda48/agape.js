---
trigger: glob
globs: models/**/*.ts
---

# Agape.js Data Model Rules

## 1. Core Architecture: Class Table Inheritance (CTI)

Agape.js uses the **Class Table Inheritance (CTI)** pattern to map OOP inheritance to SQL.

### The Pattern

- **Master Table (`user`):** Contains shared identity, authentication data, and the discriminator column (`type`).
- **Detail Tables (`person`, `company`):** Contain specific attributes.
- **Identity Rule:** The Primary Key (PK) of the detail table is **also** a Foreign Key (FK) to the master table.

## 2. Domain-Driven Organization (Domains First)

**Principle: Domains First, Tables Later.** Do not pollute the root `models/` folder. New entities must live under a well-defined functional domain.

### Directory Structure

- **Core (`models/*.ts`):** Only for essential, cross-cutting application entities (e.g., `user`, `person`, `company`, `agape` config).
- **Domains (`models/<domain>/*.ts`):** All business logic specific to a module (e.g., `models/logistics/shipment.ts`, `models/invoicing/invoice.ts`).

### Decision Priority (Strict)

Before creating a table, the Agent must validate:

1.  **Domain Check:** Does this concept fit into an existing or new functional domain? -> **Put in `models/<domain>/`.**
2.  **Extension Check:** Should this extend an existing Master entity via CTI? -> **Implement CTI.**
3.  **Loose Table:** Only if it is a core system concept does it go into the root `models/`.

## 3. Global Configuration

### Schema Definition

All models must be defined using the tenant-aware schema object.

```typescript
// models/schema.ts
import Schema from "../lib/db/schema";
export const schema = Schema.tenantSchema; // ALWAYS use this, never generic pgTable
```

### Required Custom Types

Do not use raw PostgreSQL types for Dates or Money.

| Data Type    | Import Source           | Drizzle Definition                      | Usage                         |
| ------------ | ----------------------- | --------------------------------------- | ----------------------------- |
| **DateTime** | `#shared/data/DateTime` | `dateTime("col_name")`                  | **ALL** timestamps.           |
| **Decimal**  | `#shared/data/Decimal`  | `decimal("col_name")`                   | **ALL** monetary/math values. |
| **Snapshot** | `#lib/db/custom-types`  | `jsonb("col").$type<AddressSnapshot>()` | Freezing historical data.     |

## 4. CTI Implementation Guide

### A. Master Table (`models/user.ts`)

Must include a discriminator enum (`type`).

```typescript
export const user = schema.table("user", {
  id: serial("id").primaryKey(),
  type: userTypeEnum("user_type").notNull(), // Discriminator
});
```

### B. Detail Table (`models/person.ts`)

**CRITICAL RULE:** The `id` is `integer`, NOT `serial`. It references `user.id`.

```typescript
export const person = schema.table("person", {
  // PK is manually assigned from the parent User ID
  id: integer("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "restrict" }),

  firstName: varchar("first_name", { length: 100 }).notNull(),
});
```

## 5. Standard Entity Template

When creating a new model (inside a domain folder), strictly follow this template.

```typescript
// models/<domain>/<entity>.ts
import { schema } from "../schema"; // Adjust import path based on depth
import { serial, varchar, boolean, integer } from "drizzle-orm/pg-core";
import {
  relations,
  sql,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../shared/data/DateTime";

/**
 * Model: [Entity Name]
 * Purpose: [Short description]
 */
export const myEntity = schema.table("my_entity", {
  id: serial("id").primaryKey(),

  // Business Fields
  name: varchar("name", { length: 100 }).notNull(),

  // Standard Audit Fields (MANDATORY)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: dateTime("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: dateTime("updated_at")
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

// Relations
export const myEntityRelations = relations(myEntity, ({ one, many }) => ({
  // Define relations here
}));

// Type Exports (MANDATORY)
export type MyEntity = InferSelectModel<typeof myEntity>;
export type NewMyEntity = InferInsertModel<typeof myEntity>;

// Default Export
export default myEntity;
```

## 6. Naming & Style Conventions

| Element         | Case Style | Example                      |
| --------------- | ---------- | ---------------------------- |
| **File Name**   | camelCase  | `logistics/shipmentRoute.ts` |
| **SQL Table**   | snake_case | `shipment_route`             |
| **TS Constant** | camelCase  | `shipmentRoute`              |
| **SQL Column**  | snake_case | `arrival_time`               |
| **TS Property** | camelCase  | `arrivalTime`                |

## 7. Development Checklist

1. **Architecture Check:**

- Does this belong in a Domain folder? (Default: Yes)
- Is it an Actor? (Use CTI)

2. **Safety:**

- Use `onDelete: "restrict"` by default.
- Use `onDelete: "cascade"` ONLY for weak entities (detail lines).

3. **Consistency:**

- Always add JSDoc.
- Always export inferred types.
- Always use `DateTime` and `Decimal` custom types.
