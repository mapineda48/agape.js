# AGENTS.md - AI Coding Agent Instructions

This document provides guidelines for AI coding agents working in the agape.js repository.

> **Documentation Structure:** Detailed documentation is available in `.agent/docs/` and rules in `.agent/rules/`. This file serves as a quick reference.

## Project Overview

Agape.js is a full-stack TypeScript framework implementing a **basic ERP**.

**Important Architecture Note**: This project is designed for a **single-tenant** environment. It is NOT multi-tenant, and no multi-tenant logic should be added.

The framework consists of:
- **Backend**: Express 5 + Socket.IO server with RPC-style endpoints
- **Frontend**: React 19 + Vite 7 with React Compiler
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis for session and Socket.IO scaling
- **Serialization**: MessagePack (msgpackr) for efficient binary transport

## Build, Lint, and Test Commands

```bash
# Development
pnpm dev:app                          # Backend server (watch mode)
pnpm dev:web                          # Frontend Vite dev server

# Docker services (Redis, Azurite)
docker compose up -d

# Linting
pnpm lint                             # Lint all files
pnpm lint:fix                         # Auto-fix issues

# Type checking
pnpm tsc                              # Type-check all packages
pnpm -C packages/backend tsc          # Backend only
pnpm -C packages/frontend tsc         # Frontend only

# Testing
pnpm test                             # Run all tests
pnpm -C packages/backend test:run     # Backend tests
pnpm -C packages/frontend test:run    # Frontend tests

# Build
pnpm build                            # Build all (frontend then backend)
```

## Project Structure (pnpm workspaces)

```
agape.js/
├── packages/
│   ├── shared/        # Shared frontend/backend code (@agape/shared)
│   │   ├── data/      # DateTime, Decimal, File types
│   │   ├── services/  # Service contracts (type-only .d.ts for frontend)
│   │   └── rbac/      # RBAC catalog
│   ├── backend/       # Express server (@agape/backend)
│   │   ├── bin/       # Server bootstrap & build scripts
│   │   ├── lib/       # Core library (middleware, utilities)
│   │   ├── models/    # Drizzle ORM schemas (CTI pattern)
│   │   └── services/  # RPC endpoints (auto-discovered)
│   └── frontend/      # React app (@agape/frontend)
│       ├── app/       # File-based routing pages
│       ├── utils/     # Components (form, router, etc.)
│       └── __test__/  # Frontend tests
├── .agent/            # AI agent documentation and rules
├── package.json       # Workspace root
└── pnpm-workspace.yaml
```

## Code Style Guidelines

### Imports

```typescript
import type { Request, Response } from "express";  // Type-only imports first
import path from "node:path";                       // Node.js with node: prefix
import logger from "#lib/log/logger";               // Path aliases
```

### Path Aliases

| Alias | Target | Usage |
|-------|--------|-------|
| `#lib/*` | `packages/backend/lib/*` | Backend library code |
| `#models/*` | `packages/backend/models/*` | Database models |
| `#svc/*` | `packages/backend/services/*` | Service modules |
| `#shared/*` | `packages/shared/*` | Shared code (both frontend & backend) |
| `#services/*` | `packages/shared/services/*` (type-check) / Vite virtual (runtime) | Service contracts |
| `#web/*` | `packages/frontend/*` | Frontend utilities |

### TypeScript

- **Strict mode** enabled
- **verbatimModuleSyntax**: Use `import type` for type-only imports
- **Target**: ES2024 (backend), ES2022 (frontend)
- **Module**: ESNext with `"type": "module"`

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case/camelCase | `middleware.ts`, `CacheManager.ts` |
| Classes | PascalCase | `NamespaceManager` |
| Functions | camelCase | `createRpcMiddleware` |
| Constants | UPPER_SNAKE_CASE | `HTTP_STATUS` |
| Interfaces/Types | PascalCase | `IContext`, `ServiceFunction` |
| SQL Tables | snake_case | `user_address` |
| SQL Columns | snake_case | `created_at` |

### Formatting

- 2 spaces indentation, double quotes, semicolons required
- Trailing commas in multi-line structures

---

## RPC System (Zero-Boilerplate)

Agape.js uses a **Zero-Boilerplate RPC architecture**. You do not define REST routes manually.

### Backend Service Definition

Create files in `services/`. Functions are automatically exposed as endpoints:

```typescript
// services/products.ts
import { db } from "#lib/db";
import { products } from "#models/products";
import { eq } from "drizzle-orm";
import ctx from "#lib/context";
import { NotFoundError, BusinessRuleError } from "#lib/error";

/**
 * Public catalog - no authentication required.
 * @public
 */
export function getCatalog() {
  return db.query.products.findMany({
    where: eq(products.isPublic, true),
  });
}

/**
 * Get product by ID.
 * Requires authentication (no tag = authenticated users only).
 */
export async function getById(id: number) {
  return db.query.products.findFirst({ 
    where: eq(products.id, id) 
  });
}

/**
 * Create a new product.
 * @permission products.write
 */
export async function create(data: { name: string; price: number }) {
  const [product] = await db.insert(products).values(data).returning();
  return product;
}
```

### Route Mapping

| File | Export | Endpoint HTTP |
|------|--------|---------------|
| `services/users.ts` | `default` | `POST /users` |
| `services/users.ts` | `getById` | `POST /users/getById` |
| `services/admin/roles.ts` | `create` | `POST /admin/roles/create` |

### Access Control (JSDoc Tags)

| Tag | Behavior | Example |
|-----|----------|---------|
| `@public` | No authentication required | `/** @public */` |
| *(none)* | Authenticated users only | Default behavior |
| `@permission <name>` | Specific permission required | `/** @permission admin.users.delete */` |

### Wildcard Permissions

| User Permission | Allows Access To |
|-----------------|------------------|
| `*` | Everything (super admin) |
| `sales.*` | `sales.create`, `sales.read`, etc. |
| `admin.users.*` | `admin.users.create`, `admin.users.delete`, etc. |

### Request Context

```typescript
import ctx from "#lib/context";

export async function getMyOrders() {
  const userId = ctx.id;                 // ID of authenticated user
  const permissions = ctx.permissions;   // Array of permissions
  const tenant = ctx.tenant;             // Current tenant
  // Never trust user ID from frontend - always use ctx.id
}
```

### Frontend Usage

```typescript
// Import from virtual module
import { list, getById, create } from "#services/products";

// Use like normal async functions
const products = await list();
const product = await getById(123);
```

---

## Mandatory Data Types

**STRICT RULE:** Always use these types for dates and money:

| Type | Import | Usage | Reason |
|------|--------|-------|--------|
| `DateTime` | `#shared/data/DateTime` | All dates/times | Auto-serialized by RPC, extends `date-fns` |
| `Decimal` | `#shared/data/Decimal` | All monetary values | Auto-serialized by RPC, wraps `decimal.js` |

```typescript
import DateTime from "#shared/data/DateTime";
import Decimal from "#shared/data/Decimal";

// CORRECT
const now = new DateTime();
const dueDate = now.addDays(30);
const total = price.mul(quantity);  // Precision safe

// INCORRECT (Forbidden)
const now = new Date();             // Never use Date
const total = price * quantity;     // Precision loss risk
```

---

## Error Handling

Use pre-defined error classes from `#lib/error`:

```typescript
import { 
  NotFoundError, 
  ValidationError, 
  ForbiddenError,
  BusinessRuleError 
} from "#lib/error";

export async function cancelOrder(orderId: number) {
  const order = await db.query.orders.findFirst({ 
    where: eq(orders.id, orderId) 
  });

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.status === "shipped") {
    throw new BusinessRuleError("Cannot cancel a shipped order");
  }
}
```

**Database errors are automatically normalized:**
- `unique_violation` -> "The value for 'X' already exists..."
- `foreign_key_violation` -> "Cannot delete because it has related records"
- `not_null_violation` -> "Field 'X' is required"

---

## Service Layer Philosophy

Services are coordinators of **Business Logic**, not just data movers.

### Anti-patterns to Avoid

```typescript
// DON'T: Database already validates NOT NULL
if (!payload.name) throw new Error("Name required");

// DON'T: Database already validates UNIQUE
const exists = await db.query.users.findFirst({ where: eq(users.email, email) });
if (exists) throw new Error("Email exists");

// DON'T: Let agape.js middleware handle errors
try { await db.insert(...) } catch(e) { /* manual handling */ }
```

### Transaction Policy

Use `db.transaction` only when atomicity is required:

- **Single insert**: No transaction needed
- **Header + Details**: REQUIRED transaction
- **Read-Calculate-Write**: REQUIRED transaction

```typescript
export async function createOrder(items: OrderItem[]) {
  return db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({ userId: ctx.id }).returning();
    await tx.insert(orderItems).values(
      items.map(item => ({ orderId: order.id, ...item }))
    );
    return order;
  });
}
```

---

## Data Models (Drizzle ORM)

### Class Table Inheritance (CTI)

Agape.js uses CTI for entity hierarchies:

```typescript
// Master table
export const user = schema.table("user", {
  id: serial("id").primaryKey(),
  type: userTypeEnum("user_type").notNull(), // Discriminator
});

// Detail table - PK is FK to master
export const person = schema.table("person", {
  id: integer("id")           // NOT serial!
    .primaryKey()
    .references(() => user.id, { onDelete: "restrict" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
});
```

### Domain Organization

- **Core (`models/*.ts`)**: Essential entities (user, person, company)
- **Domains (`models/<domain>/*.ts`)**: Business-specific (logistics, invoicing)

### Standard Model Template

```typescript
import { schema } from "./schema";
import { serial, varchar, boolean } from "drizzle-orm/pg-core";
import { relations, sql, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { dateTime } from "../lib/db/custom-types";
import DateTime from "../shared/data/DateTime";

export const myEntity = schema.table("my_entity", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  
  // Audit fields (MANDATORY)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: dateTime("created_at").notNull().default(sql`now()`),
  updatedAt: dateTime("updated_at").notNull().default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

export type MyEntity = InferSelectModel<typeof myEntity>;
export type NewMyEntity = InferInsertModel<typeof myEntity>;
export default myEntity;
```

---

## WebSocket (Real-Time)

### Service Contract (shared/services/)

Event types and interfaces are defined in `shared/services/` as `.d.ts` files. Both frontend and backend import types from here:

```typescript
// shared/services/chat.d.ts (type-only contract)
import type { ConnectedSocket } from "#shared/socket";

export type ChatEvents = {
  "message:send": { text: string; sender: string };
  "message:received": { id: string; text: string; sender: string };
};

declare const socket: ConnectedSocket<ChatEvents>;
export default socket;
```

### Server-Side

```typescript
// services/chat.ts (backend implementation)
import { registerNamespace } from "#lib/socket/namespace";
import type { ChatEvents } from "#shared/services/chat";

/**
 * Public chat namespace
 * @public
 */
const socket = registerNamespace<ChatEvents>();

socket.on("message:send", (payload) => {
  socket.emit("message:received", {
    id: crypto.randomUUID(),
    ...payload,
  });
});

export default socket;
```

### Client-Side

```typescript
import socket from "#services/chat";

const connection = socket.connect();
connection.on("message:received", (msg) => console.log(msg));
connection.emit("message:send", { text: "Hello!", sender: "User" });
connection.disconnect();
```

---

## Frontend Router (File-Based)

### File Conventions

| File | Purpose | URL |
|------|---------|-----|
| `web/app/page.tsx` | Homepage | `/` |
| `web/app/users/page.tsx` | Users page | `/users` |
| `web/app/users/[id]/page.tsx` | Dynamic page | `/users/:id` |
| `web/app/cms/_layout.tsx` | Layout wrapper | Wraps `/cms/*` |

### Page with Data Loading

```tsx
// web/app/products/[id]/page.tsx

// Runs BEFORE render
export async function onInit({ params, query }) {
  const product = await fetchProduct(params.id);
  return { product };
}

// Receives data as props
export default function ProductPage({ product }) {
  return <h1>{product.name}</h1>;
}
```

### Navigation

```tsx
import { useRouter } from "#web/utils/components/router";

function MyComponent() {
  const { navigate, params, pathname } = useRouter();
  
  // Absolute navigation
  navigate("/login");
  
  // Layout-relative (preferred inside modules)
  navigate("products");        // -> /current-layout/products
  
  // Relative navigation
  navigate("../");             // Go up one level
}
```

---

## Form System

### Basic Structure

```tsx
import Form from "#web/utils/components/form";
import EventEmitter from "#web/utils/components/event-emitter";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

function MyForm() {
  return (
    <EventEmitter>
      <Form.Root state={{ name: "", email: "" }} schema={schema}>
        <Form.Field name="name" required>
          <Form.Label>Name</Form.Label>
          <Form.Text />
          <Form.Error />
        </Form.Field>
        
        <Form.Field name="email">
          <Form.Label>Email</Form.Label>
          <Form.Text type="email" />
          <Form.Error />
        </Form.Field>
        
        <Form.Submit onSubmit={handleSubmit}>Save</Form.Submit>
      </Form.Root>
    </EventEmitter>
  );
}
```

### Input Components

| Type | Component | Notes |
|------|-----------|-------|
| String | `Form.Text` | text, email, password |
| Long Text | `Form.TextArea` | |
| Integer | `Form.Int` | |
| Float | `Form.Float` | |
| Money | `Form.Decimal` | **Required** for financial data |
| Date | `Form.DateTime` | **Required** for dates |
| Boolean | `Form.Checkbox` | |
| File | `Form.File` | |
| Select | `Form.Select.String/Int/Boolean` | **Outside** Form.Field |

---

## Key Architecture Files

| Component | Path | Purpose |
|-----------|------|---------|
| RPC Middleware | `lib/rpc/middleware.ts` | Entry point for RPC |
| Authorization | `lib/rpc/rbac/authorization.ts` | Validates permissions |
| Context | `lib/context.ts` | AsyncLocalStorage wrapper |
| Errors | `lib/error.ts` | Pre-defined error classes |
| Virtual Modules | `lib/vite/virtual-module.ts` | Generates frontend proxies |
| Socket Manager | `lib/socket/namespace.ts` | Socket.IO namespaces |
| MessagePack | `shared/msgpackr.ts` | Serialization config |
| Client RPC | `web/utils/rpc.ts` | Frontend RPC client |
| Form System | `web/utils/components/form/` | Form components |
| Router | `web/utils/components/router/` | File-based router |

---

## Development Checklist

### When Writing Services
- [ ] Using `DateTime` and `Decimal` for dates/money?
- [ ] Removed manual NOT NULL/UNIQUE checks?
- [ ] Multi-step write? Wrapped in `db.transaction`?
- [ ] Added correct JSDoc tag (`@public`, `@permission`)?
- [ ] Getting user ID from `ctx`, not from frontend?

### When Writing Models
- [ ] Using `dateTime` and `decimal` custom types?
- [ ] Added audit fields (`createdAt`, `updatedAt`)?
- [ ] Exported inferred types?
- [ ] Using `onDelete: "restrict"` by default?

### When Writing Frontend
- [ ] Data loading uses `onInit`, not `useEffect`?
- [ ] Using `Form.Decimal` for money, `Form.DateTime` for dates?
- [ ] Selects are outside `Form.Field`?
- [ ] Using `Form.useSelector` instead of `Form.useState`?
- [ ] Form wrapped in `<EventEmitter>`?
