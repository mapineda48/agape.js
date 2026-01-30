# AGENTS.md - AI Coding Agent Instructions

This document provides guidelines for AI coding agents working in the agape.js repository.

## Project Overview

Agape.js is a full-stack TypeScript framework implementing a **basic ERP**.
**Important Architecture Note**: This project is designed for a **single-tenant** environment. It is NOT multi-tenant, and no multi-tenant logic (e.g., tenant isolation in queries, tenant context propagation) should be added.

The framework consists of:
- **Backend**: Express 5 + Socket.IO server with RPC-style endpoints
- **Frontend**: React 19 + Vite 7 with React Compiler
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis for session and Socket.IO scaling
- **Serialization**: MessagePack (msgpackr) for efficient binary transport

## Build, Lint, and Test Commands

```bash
# Development
pnpm app                              # Backend server (watch mode)
pnpm web                              # Frontend Vite dev server
pnpm tsx <file.ts>                    # Run any TS file with watch

# Docker services (Redis, Azurite)
docker compose up -d

# Linting
npx eslint .                          # Lint all files
npx eslint path/to/file.ts            # Lint specific file
npx eslint . --fix                    # Auto-fix issues

# Type checking
npx tsc --noEmit -p tsconfig.app.json # Backend
npx tsc --noEmit -p tsconfig.web.json # Frontend

# Build
npx vite build                        # Build frontend for production
```

**Note**: No test runner is currently configured.

## Project Structure

```
agape.js/
├── bin/           # Express server bootstrap
├── lib/           # Core library (middleware, utilities)
│   ├── context.ts # AsyncLocalStorage request context
│   ├── rpc/       # RPC middleware system
│   ├── security/  # JWT, authentication
│   └── socket/    # Socket.IO namespace management
├── models/        # Drizzle ORM schemas
├── services/      # RPC endpoints (auto-discovered)
├── shared/        # Shared frontend/backend code
└── web/           # React frontend application
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
| `#lib/*` | `lib/*` | Backend library code |
| `#models/*` | `models/*` | Database models |
| `#svc/*` | `services/*` | Service modules |
| `#shared/*` | `shared/*` | Shared code |
| `#/*` | `web/*` | Frontend modules |
| `#services/*` | `services/*` | Virtual modules for frontend RPC |

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

### Formatting

- 2 spaces indentation, double quotes, semicolons required
- Trailing commas in multi-line structures

### Error Handling

```typescript
try {
  const result = await handler(...args);
  sendSuccess(res, result);
} catch (error) {
  sendError(res, error); // Logs and normalizes errors
}
```

- Database errors normalized in `lib/rpc/error.ts`
- Throw errors with meaningful messages (sent to clients)
- Use `try/catch` with `async/await`

### Service Functions

Services in `services/` are auto-discovered as RPC endpoints:

```typescript
// services/users.ts
// POST /users/getById
export async function getById(id: number): Promise<User> {
  return await db.query.users.findFirst({ where: eq(users.id, id) });
}

// POST /users (default export)
export default async function listUsers(): Promise<User[]> {
  return await db.query.users.findMany();
}
```

### Socket.IO Namespaces

```typescript
// services/chat.ts
import { registerNamespace } from "#lib/socket/namespace";

type ChatEvents = {
  "message:send": { text: string; sender: string };
  "message:received": { id: string; text: string; sender: string };
};

const socket = registerNamespace<ChatEvents>();

socket.on("message:send", (payload) => {
  socket.emit("message:received", { ...payload, id: crypto.randomUUID() });
});

export default socket;
```

### Request Context

```typescript
import ctx from "#lib/context";

export async function getCurrentUser() {
  const userId = ctx.id;       // Access request-scoped context
  const tenant = ctx.tenant;
}
```

## Key Architectural Patterns

1. **Virtual Modules**: Services exposed to frontend via Vite virtual modules (`#services/*`)
2. **RPC over Multipart**: Frontend uses multipart/form-data with msgpack for file uploads
3. **Singleton Services**: Infrastructure uses lazy singleton patterns
4. **Type-safe Events**: Socket.IO uses shared type definitions

## Dependencies

- **msgpackr**: Binary serialization with custom type extensions
- **drizzle-orm**: Type-safe SQL query builder
- **jose**: JWT handling
- **date-fns**: Date manipulation
- **decimal.js**: Precision decimal arithmetic
- **formidable**: Multipart form parsing
