---
trigger: always_on
---

# Agape.js RPC System Rules

## 1. System Overview

Agape.js utilizes a **Zero-Boilerplate RPC architecture**. You do not define REST routes manually.

- **Source of Truth:** Files located in `services/`.
- **Mechanism:** Functions exported from `services/*.ts` are automatically exposed as API endpoints.
- **Transport:** Requests use `POST` with `multipart/form-data`. Arguments are serialized via **MessagePack**.

## 2. Backend Service Definition (`services/`)

### File Structure & Routing

- Create files in `services/`. The filename becomes the module namespace.
- **Named Exports:** Map to specific methods (e.g., `export function create` -> `POST /module/create`).
- **Default Export:** Maps to the root of the module (e.g., `export default` -> `POST /module`).

### Security & Access Control (JSDoc)

Access control is declarative via JSDoc tags above the function.

| Tag           | Behavior                                               | Example                                        |
| :------------ | :----------------------------------------------------- | :--------------------------------------------- |
| **(None)**    | **Authenticated Users Only.** Requires valid session.  | `export function list() {...}`                 |
| `@public`     | **Public Access.** No authentication required.         | `/** @public */ export function login() {...}` |
| `@permission` | **RBAC Enforced.** User must have specific permission. | `/** @permission admin.users.write */`         |

### Context Access (`ctx`)

Never pass user IDs or session data as arguments from the frontend. Use the global context.

```typescript
import ctx from "#lib/context";

export async function getMyData() {
  const userId = ctx.id; // Current User ID
  const tenant = ctx.tenant; // Current Tenant
  // ... logic
}
```

### Error Handling

Use pre-defined error classes from `#lib/error`. These are automatically serialized and sent to the frontend.

- `NotFoundError`: Resource missing.
- `ValidationError`: Invalid input.
- `ForbiddenError`: Permission denied (manual check).
- `BusinessRuleError`: Logic violation (e.g., "Order already shipped").

**Note:** PostgreSQL errors (Unique, FK violations) are automatically caught and normalized into user-friendly messages.

## 3. Frontend Consumption

### Importing Services

Import functions directly from the **Virtual Module** `#services/<filename>`.

```typescript
// Pattern: import { method } from "#services/<filename>"
import { list, create } from "#services/products";
```

### Usage in React

Functions are asynchronous. Use standard `async/await` patterns.

```typescript
const [data, setData] = useState([]);

useEffect(() => {
  // Called exactly like a local async function
  list().then(setData);
}, []);
```

## 4. Data Types & Serialization

The system uses MessagePack. Standard JSON limitations do not apply.

- **Dates:** Use `DateTime` from `#shared/data/DateTime`. It is preserved across the wire.
- **Decimals:** Use `Decimal.js`. Precision is preserved.
- **Files:** Pass `File` objects directly as arguments.
- _Frontend:_ `upload(myFileObject)`
- _Backend:_ Receives an object with `{ name, type, size, filepath }`.

## 5. Real-Time (Socket.IO)

To create a socket namespace, create a service file and export a socket instance as `default`.

```typescript
// services/chat.ts
import { registerNamespace } from "#lib/socket/namespace";

// 1. Define Types
type ChatEvents = { "msg:send": { text: string } };

// 2. Register
const socket = registerNamespace<ChatEvents>();

// 3. Define Handlers
socket.on("msg:send", (data) => {
  /* ... */
});

// 4. Export as Default
export default socket;
```

## 6. Architecture Reference (Files)

| Core Component     | Path                            | Purpose                         |
| ------------------ | ------------------------------- | ------------------------------- |
| **RPC Middleware** | `lib/rpc/middleware.ts`         | Entry point for RPC execution.  |
| **Auth/RBAC**      | `lib/rpc/rbac/authorization.ts` | Validates JSDoc permissions.    |
| **Virtual Mod**    | `lib/vite/virtual-module.ts`    | Generates the frontend proxies. |
| **Context**        | `lib/context.ts`                | `AsyncLocalStorage` wrapper.    |

## 7. Example: Complete Service

```typescript
// services/orders.ts
import { db } from "#lib/db";
import { orders } from "#models/orders";
import { eq } from "drizzle-orm";
import ctx from "#lib/context";
import { NotFoundError } from "#lib/error";

/** * Public catalog view
 * @public
 */
export async function getCatalog() {
  return db.query.products.findMany();
}

/** * Place an order
 * (Implicitly requires Auth)
 */
export async function create(items: any[]) {
  return db.transaction(async (tx) => {
    // Use ctx.id, never trust frontend user ID
    const [order] = await tx
      .insert(orders)
      .values({
        userId: ctx.id,
        total: items.reduce((a, b) => a + b.price, 0),
      })
      .returning();
    return order;
  });
}

/** * Admin only deletion
 * @permission admin.orders.delete
 */
export async function remove(id: number) {
  const exists = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!exists) throw new NotFoundError("Order not found");

  await db.delete(orders).where(eq(orders.id, id));
}
```
