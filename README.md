# Agape.js

> This is a small project built for a single tenant per deployment. It’s a simple ERP I worked on a few years ago as part of my journey learning web development. It’s not meant for production use—just a side project.
>
> If you have any questions or thoughts, feel free to reach out 🙂

## Stack

- **Backend**: Express 5 + Socket.IO + RPC-style endpoints
- **Frontend**: React 19 + Vite 7 with React Compiler
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis (sessions + Socket.IO scaling)
- **Serialization**: MessagePack (msgpackr)

## Quick Start

```bash
# Start infrastructure (Redis, Azurite)
docker compose up -d

# Install dependencies
pnpm install

# Run backend (watch mode)
pnpm app

# Run frontend (Vite dev server)
pnpm web
```

## Project Structure

```
agape.js/
├── bin/            # Express server bootstrap
├── lib/            # Core library (middleware, RPC, security, socket, vite)
├── models/         # Drizzle ORM schemas
├── services/       # RPC endpoints (backend only, auto-discovered)
├── shared/         # Shared frontend/backend code
│   ├── data/       # DateTime, Decimal, File, Error types
│   ├── security/   # Auth types (IUserSession, LoginRequest)
│   └── services/   # Service contracts (.d.ts) for frontend type-checking
└── web/            # React frontend application
    ├── app/        # File-based routing pages
    └── utils/      # Components (form, router, rpc, socket)
```

## Architecture: Service Contracts

The project uses a **type-safe RPC system** where the frontend imports services via virtual modules (`#services/*`). At runtime, Vite intercepts these imports and generates RPC client code automatically. For TypeScript type-checking, the frontend resolves `#services/*` to `shared/services/*` which contains **type-only `.d.ts` contracts**.

### Why service contracts?

The `services/` directory contains backend implementations that import Node.js-only modules (`#lib/db`, `#lib/socket/namespace`, etc.). The frontend cannot type-check these files because those modules don’t exist in the browser context.

The solution separates **contract** (types/signatures) from **implementation**:

```
shared/services/         # Contract (type-only .d.ts)
├── chat.d.ts            # ChatMessage, ChatEvents, ConnectedSocket
├── public.d.ts          # sayHello() signature
├── web.d.ts             # notifyError() signature
└── security/
    └── session.d.ts     # login(), logout(), isAuthenticated()

services/                # Implementation (backend only)
├── chat.ts              # Imports types from #shared/services/chat
├── public.ts            # Actual sayHello() implementation
├── web.ts               # Actual notifyError() implementation
└── security/
    └── user.ts          # findUserByCredentials(), findUserById()
```

### How it works

1. **Backend** (`tsconfig.app.json`): `#svc/*` resolves to `services/*` (full implementations)
2. **Frontend type-check** (`tsconfig.web.json`): `#services/*` resolves to `shared/services/*` (type-only contracts)
3. **Frontend runtime** (Vite): `#services/*` is intercepted by the Vite plugin and replaced with auto-generated RPC/Socket client code

### Adding a new service

1. Define the contract in `shared/services/myservice.d.ts`:

```typescript
export function myFunction(arg: string): Promise<MyResult>;
```

2. Implement in `services/myservice.ts`:

```typescript
import { db } from "#lib/db";

/**
 * @public
 */
export function myFunction(arg: string) {
  return db.query.myTable.findMany();
}
```

3. Use in the frontend:

```typescript
import { myFunction } from "#services/myservice";

const result = await myFunction("hello");
```

## Path Aliases

| Alias | Target | Context |
|-------|--------|---------|
| `#lib/*` | `lib/*` | Backend |
| `#models/*` | `models/*` | Backend |
| `#svc/*` | `services/*` | Backend |
| `#shared/*` | `shared/*` | Both |
| `#services/*` | `shared/services/*` (types) / virtual modules (runtime) | Frontend |
| `#web/*` | `web/*` | Frontend |

## Type Checking

```bash
# Backend
pnpm tsc:app

# Frontend
pnpm tsc:web
```

## Key Conventions

- **Dates**: Always use `DateTime` from `#shared/data/DateTime` (never `Date`)
- **Money**: Always use `Decimal` from `#shared/data/Decimal` (never `number`)
- **Access control**: Use JSDoc tags (`@public`, `@permission <name>`) on service functions
- **Request context**: Use `ctx` from `#lib/context` for authenticated user info

See [AGENTS.md](./AGENTS.md) for detailed development guidelines.

