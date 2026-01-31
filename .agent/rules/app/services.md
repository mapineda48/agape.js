---
trigger: glob
globs: services/**/*md
---

# Agape.js Service Layer Rules

## 1. Core Philosophy

Services are the coordinators of **Business Logic**, not just data movers.

- **Location:** All service logic must reside in `<root>/services/`.
- **No Raw CRUD:** Do not create services that just wrap a single `db.insert` without context.
- **Database First Defense:** Do not manually check for `NOT NULL` or `UNIQUE` constraints in code. Let the database throw errors; Agape.js middleware translates them automatically.

## 2. The Service Canonical Structure

Every service function must follow this execution flow:

1.  **Input:** Receive a strictly typed DTO (Data Transfer Object).
2.  **Transaction (Conditional):** Open `db.transaction` only if multiple write operations are dependent.
3.  **Hydration:** Fetch necessary data to validate state.
4.  **Validation:** Check **Business Rules** (e.g., "Is stock available?", "Is user active?"). Throw `BusinessRuleError` if failed.
5.  **Execution:** Perform `insert`, `update`, or `delete`.
6.  **Return:** Return the result or a specific DTO.

## 3. Mandatory Data Types

**STRICT RULE:** Never use native `Date` or `number` for financial/temporal data.

| Type         | Import Source           | Usage                 | Reason                                            |
| :----------- | :---------------------- | :-------------------- | :------------------------------------------------ |
| **DateTime** | `#shared/data/DateTime` | All dates/times.      | Auto-serialized by RPC. Wrapper for `date-fns`.   |
| **Decimal**  | `#shared/data/Decimal`  | All money/quantities. | Auto-serialized by RPC. Wrapper for `decimal.js`. |

### Usage Examples

```typescript
import DateTime from "#shared/data/DateTime";
import Decimal from "#shared/data/Decimal";

// CORRECT
const now = new DateTime();
const total = price.mul(quantity); // Precision safe

// INCORRECT (Forbidden)
const now = new Date();
const total = price * quantity; // Precision loss risk
```

## 4. Transaction Policy

**Do NOT use transactions for single operations.**

- **❌ Single Insert:** `db.insert(...)` -> No transaction needed.
- **✅ Composite:** Create Header + Create Lines -> **REQUIRED** `db.transaction`.
- **✅ Read-Calc-Write:** Read balance -> Check -> Update balance -> **REQUIRED** `db.transaction`.

## 5. Security & Access Control (RBAC)

Access is defined via JSDoc tags on the exported function.

| Tag           | Meaning                       | Example                                              |
| ------------- | ----------------------------- | ---------------------------------------------------- |
| **(None)**    | Authenticated Users Only.     | `export async function list() {...}`                 |
| `@public`     | Public access (No Auth).      | `/** @public */ export async function login() {...}` |
| `@permission` | Specific Permission required. | `/** @permission sales.orders.create */`             |

**Context Access:**
Never pass `userId` as an argument from the frontend.

```typescript
import ctx from "#lib/context";

export async function create() {
  const userId = ctx.id; // Secure source of truth
  // ...
}
```

## 6. Real-Time (WebSockets)

Socket logic lives in `services/` alongside RPC logic.

### Server-Side Definition

To create a socket namespace, export a `ConnectedSocket` as `default`.

```typescript
// services/chat.ts
import { registerNamespace } from "#lib/socket/namespace";

// 1. Define Events
type ChatEvents = {
  "msg:send": { text: string };
  "msg:receive": { text: string; from: string };
};

// 2. Register (RBAC tags apply here too)
/** @permission users.chat */
const socket = registerNamespace<ChatEvents>();

// 3. Define Handlers
socket.on("msg:send", (data, handlerCtx) => {
  // handlerCtx contains socket specific context
  socket.emit("msg:receive", { text: data.text, from: handlerCtx.context.id });
});

// 4. Export Default
export default socket;
```

### Client-Side Consumption

Import the virtual module.

```typescript
import socket from "#services/chat";

// Usage in React
const conn = socket.connect();
conn.emit("msg:send", { text: "Hello" });
conn.on("msg:receive", (data) => console.log(data));
```

## 7. Development Checklist

When writing a service function, ask:

1. [ ] Am I using `DateTime` and `Decimal`?
2. [ ] Did I remove manual "Not Null" checks?
3. [ ] Is this a multi-step write? If yes, wrap in `db.transaction`.
4. [ ] Did I add the correct JSDoc tag (`@permission`)?
5. [ ] Am I getting the User ID from `ctx` (RPC) or `handlerCtx` (Socket)?
