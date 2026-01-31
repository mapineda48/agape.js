---
trigger: glob
globs: services/**/*md
---

# Agape.js Service Layer Rules

## 1. Location & Scope

- **Location:** All business logic resides strictly in `<root>/services`.
- **Philosophy:** Services are **Coordinators of Business Logic**, not simple CRUD wrappers.
- **Anti-Pattern:** Do not create "Pass-through" services that just call `db.insert`. If there is no logic, the logic _is_ the persistence.

## 2. The "Database First" Defense

**Rule:** Do not duplicate validations that the Database Engine already guarantees. `agape.js` automatically translates SQL errors (constraints) into user-friendly messages.

| Validation Type     | Responsibility            | Action in Service Code                                         |
| :------------------ | :------------------------ | :------------------------------------------------------------- |
| **Required Fields** | Database (`NOT NULL`)     | **None.** Do not use `if (!field)...`                          |
| **Duplicates**      | Database (`UNIQUE INDEX`) | **None.** Do not query before insert.                          |
| **Foreign Keys**    | Database (`REFERENCES`)   | **None.** Let it fail if ID is invalid.                        |
| **Business State**  | **Service Layer**         | **Validate.** (e.g., "Is stock available?", "Is user active?") |

## 3. Mandatory Data Types

**CRITICAL RULE:** The RPC system uses MessagePack extensions. You **MUST** use specific types to guarantee precision and serialization.

### A. Dates & Times

- **NEVER** use native `Date` or strings for dates.
- **ALWAYS** use `DateTime` from `#shared/data/DateTime`.

```typescript
import DateTime from "#shared/data/DateTime";

// Correct Usage
const now = new DateTime();
const expiry = now.addDays(30);
```

### B. Money & Precision Numbers

- **NEVER** use `number` or `float` for currency/quantities.
- **ALWAYS** use `Decimal` from `#shared/data/Decimal`.

```typescript
import Decimal from "#shared/data/Decimal";

// Correct Usage
const price = new Decimal("19.99");
if (price.lte(0)) throw new BusinessError("Invalid price");
const total = price.mul(quantity); // Precision safe
```

## 4. Transaction Policy (`db.transaction`)

Transactions are expensive. Use them only when atomicity is required.

- **WHEN TO USE:**

1. **Composite Writes:** Writing to Header + Details (e.g., Invoice + Items).
2. **Read-Modify-Write:** Reading a balance, calculating, and updating it (prevent race conditions).
3. **Multi-Entity:** Creating User + Profile + Settings.

- **WHEN TO AVOID:**

1. Simple single-table inserts/updates.
2. Read-only operations.

## 5. Standard Service Function Template

Follow this flow for all service functions.

```typescript
import { db } from "#lib/db";
import { myTable } from "#models/myDomain/myTable";
import { BusinessRuleError } from "#lib/error";
import DateTime from "#shared/data/DateTime";
import Decimal from "#shared/data/Decimal";

export async function processOrder(input: ProcessOrderDTO) {
  // 1. Transaction Wrapper (Only if needed)
  return db.transaction(async (tx) => {
    // 2. Hydration (Gather data for decision making)
    const product = await tx.query.products.findFirst({
      where: eq(products.id, input.productId),
    });

    // 3. Business Logic Validation (State checks)
    // NOT basic null checks. Logic checks.
    if (!product.isSellable) {
      throw new BusinessRuleError("Product is not sellable");
    }

    // 4. Calculations (Using Decimal)
    const total = product.price.mul(input.quantity);

    // 5. Persistence
    const [order] = await tx
      .insert(orders)
      .values({
        ...input,
        total: total,
        createdAt: new DateTime(), // Use DateTime
      })
      .returning();

    // 6. Return Clean Data
    return order;
  });
}
```

## 6. Real-Time WebSockets (Socket.IO)

### A. Defining a Namespace (Backend)

Create a `socket.ts` file inside the service folder. The path determines authentication.

- `services/public/socket.ts` -> Public access.
- `services/chat/socket.ts` -> Authenticated (Cookie JWT).

```typescript
// services/chat/socket.ts
import { registerNamespace } from "#lib/socket/namespace";
import DateTime from "#shared/data/DateTime";

// 1. Define Types
type ChatEvents = {
  "msg:send": { text: string }; // Incoming
  "msg:new": { id: string; text: string; date: DateTime }; // Outgoing
};

// 2. Register & Export
const socket = registerNamespace<ChatEvents>();

// 3. Server-side Listeners
socket.on("msg:send", (payload) => {
  // Logic here
});

export default socket;
```

### B. Emitting Events (Backend)

Import the socket instance in your service logic.

```typescript
import socket from "./socket";

export async function sendMessage(text: string) {
  // ... DB logic ...
  socket.emit("msg:new", {
    id: "123",
    text,
    date: new DateTime(), // Serialized automatically
  });
}
```

### C. Consuming in React (Frontend)

Use the virtual import `#services/.../socket`.

```typescript
import socket from "#services/chat/socket";

// Inside Component
useEffect(() => {
  const conn = socket.connect();

  // Types are inferred automatically
  const unsub = conn.on("msg:new", (msg) => {
    console.log(msg.text);
  });

  return () => {
    unsub();
    conn.disconnect();
  };
}, []);
```

## 7. Anti-Pattern Checklist

Before finishing a task, verify:

1. [ ] Did I use `new Date()`? -> **REPLACE** with `new DateTime()`.
2. [ ] Did I use `number` for money? -> **REPLACE** with `Decimal`.
3. [ ] Did I write `if (!name) throw...`? -> **REMOVE**. Let DB `NOT NULL` handle it.
4. [ ] Did I use `try/catch` wrapping a simple insert? -> **REMOVE**. Let global handler catch it.
