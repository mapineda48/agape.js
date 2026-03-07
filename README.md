# Agape.js

A single-tenant-per-deployment simple ERP built with TypeScript. Unified codebase with a custom Express server, Next.js frontend, and Socket.IO real-time communication — all sharing the same HTTP server.

## Quick Start

```bash
# Prerequisites: Node.js 22+, pnpm, Docker (for infrastructure)

# Start infrastructure (PostgreSQL, Redis, Azurite, pgAdmin)
docker compose up -d

# Install dependencies
pnpm install

# Development (starts Express + Next.js + Socket.IO on port 3000)
pnpm dev

# Production build
pnpm build

# Production start
pnpm start
```

## Architecture

```
Browser ──► Express (port 3000)
              ├── MessagePack RPC requests → Express middleware → services/*
              ├── Socket.IO connections    → lib/socket/       → services/*
              └── Everything else          → Next.js handler   → app/*
```

A single HTTP server handles three concerns:

1. **RPC (Express middleware)** — Service functions in `services/` are auto-discovered and exposed as HTTP endpoints. Clients call them via MessagePack-encoded requests. No REST routes to define.
2. **Real-time (Socket.IO)** — Socket namespaces in `services/` are auto-discovered. Uses Redis adapter for horizontal scaling.
3. **Pages (Next.js)** — Server Components, Client Components, SSR, static — all standard Next.js features via the App Router.

### Directory Structure

```
app/              → Next.js App Router pages and layouts
lib/              → Core framework (RPC, DB, auth, context, socket, codegen)
models/           → Drizzle ORM database models (PostgreSQL)
services/         → Backend business logic (auto-exposed as RPC endpoints)
shared/           → Code shared between frontend and backend
web/              → React components, hooks, utilities
web/__generated__/→ Auto-generated service client proxies (gitignored)
server.ts         → Custom server entry point
```

## Creating Services

A service is a TypeScript file in `services/` that exports functions. They are automatically available as RPC endpoints — no routing config needed.

```ts
// services/inventory.ts
import { ctx } from "#lib/context";

/** @public */
export async function getProducts() {
  // ctx provides request-scoped context (tenant, user, permissions)
  const db = ctx.tenant.db;
  return db.select().from(products);
}

export async function createProduct(name: string, price: Decimal) {
  // No @public tag = requires authentication
  const db = ctx.tenant.db;
  return db.insert(products).values({ name, price }).returning();
}

/** @permission inventory.delete */
export async function deleteProduct(id: number) {
  // Requires specific RBAC permission
  const db = ctx.tenant.db;
  return db.delete(products).where(eq(products.id, id));
}
```

### Security Tags (JSDoc)

| Tag | Meaning |
|-----|---------|
| `@public` | No authentication required |
| *(no tag)* | Requires authentication |
| `@permission <name>` | Requires specific RBAC permission (e.g., `inventory.delete`) |

## Consuming Services

The same service functions are accessible from two paths:

### From Client Components (RPC)

Import from `#services/*` — these are auto-generated proxies that call the server via MessagePack-encoded HTTP requests.

```tsx
"use client";
import { getProducts, createProduct } from "#services/inventory";

export default function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  // createProduct("Widget", new Decimal("9.99")) works the same way
}
```

### From Server Components (Direct)

Import from `#svc/*` and wrap with `callService()` — this executes the function directly on the server with proper AsyncLocalStorage context, sending zero JavaScript to the client.

```tsx
// app/products/page.tsx (Server Component — no "use client")
import { callService } from "#lib/rpc/server";
import { getProducts } from "#svc/inventory";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await callService(getProducts);

  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name} — ${p.price.toString()}</li>
      ))}
    </ul>
  );
}
```

## Creating Pages

Pages use the [Next.js App Router](https://nextjs.org/docs/app) in the `app/` directory.

### Client Component Page

```tsx
// app/dashboard/page.tsx
"use client";
import { getSummary } from "#services/reports";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  useEffect(() => { getSummary().then(setData); }, []);
  return <div>{/* render data */}</div>;
}
```

### Server Component Page (SSR, zero JS)

```tsx
// app/reports/page.tsx
import { callService } from "#lib/rpc/server";
import { getReport } from "#svc/reports";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const report = await callService(getReport);
  return <div>{/* render report — no JS sent to client */}</div>;
}
```

### Layouts

```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <nav>{/* sidebar */}</nav>
      <main>{children}</main>
    </div>
  );
}
```

### Dynamic Routes

Use `[param]` folder names:

```
app/products/[id]/page.tsx  →  /products/42
```

```tsx
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

## Socket.IO (Real-time)

Services can export Socket.IO namespaces alongside RPC functions:

```ts
// services/chat.ts
import { registerNamespace } from "#lib/socket";

const chat = registerNamespace("/chat", (socket) => {
  socket.on("message", (msg) => {
    socket.broadcast.emit("message", msg);
  });
});

export default chat;
```

Client-side, import from `#services/*` — socket exports become connection factories:

```tsx
"use client";
import chatSocket from "#services/chat";

useEffect(() => {
  const socket = chatSocket();
  socket.on("message", (msg) => console.log(msg));
  return () => { socket.disconnect(); };
}, []);
```

## Path Aliases

| Alias | Resolves to | Available in |
|-------|------------|--------------|
| `#web/*` | `web/` | Frontend (Client & Server Components) |
| `#shared/*` | `shared/` | Both frontend and backend |
| `#services/*` | `web/__generated__/services/` | Client Components (RPC proxies) |
| `#lib/*` | `lib/` | Backend / Server Components |
| `#svc/*` | `services/` | Backend / Server Components |
| `#models/*` | `models/` | Backend / Server Components |

## MessagePack & Custom Types

RPC uses MessagePack (binary) instead of JSON for serialization. Custom extension types are handled transparently:

| Type | Usage |
|------|-------|
| `DateTime` | Use instead of raw `Date`. Constructed via `DateTime.create()` or `new DateTime()`. |
| `Decimal` | Use instead of `number` for monetary/precise values. From `decimal.js`. |
| `File` | File uploads via multipart FormData with msgpack-encoded args. |

## Commands

```bash
pnpm dev                # Development server (port 3000)
pnpm build              # Production build (codegen + next build)
pnpm start              # Production server
pnpm codegen            # Regenerate service client proxies manually
pnpm test               # Run all tests
pnpm test:app           # Backend tests only
pnpm test:web           # Frontend tests only
pnpm lint               # ESLint
pnpm drizzle:generate   # Generate migration SQL from models
pnpm drizzle:push       # Push schema changes to database
```

## How It All Connects

1. **On startup** (`pnpm dev` or `pnpm build`), `next.config.ts` auto-runs the codegen script.
2. The codegen reads every `services/*.ts` file, parses exports with regex, and generates `web/__generated__/services/*.ts` with `makeRpc()`/`makeSocket()` proxy calls.
3. When the browser imports `#services/inventory`, it gets the generated proxy that sends MessagePack-encoded HTTP requests to Express.
4. Express middleware matches the RPC request, discovers the target service function, validates auth/permissions via JSDoc tags, and executes it.
5. Server Components import `#svc/inventory` directly and use `callService()` to run the function in-process with proper request context.
6. Socket.IO namespaces are discovered and mounted on the same HTTP server, using Redis for multi-instance scaling.
