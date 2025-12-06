# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build, Test, and Development Commands

```bash
# Development
pnpm dev              # Vite dev server (frontend, port 5173)
pnpm backend          # Watch-mode backend with tsx
pnpm frontend         # Alias for pnpm dev

# Build
pnpm build            # Custom build (type-check + Vite frontend + process backend)
pnpm preview          # Serve built SPA locally

# Testing
pnpm test             # Vitest (dual projects: backend/node + frontend/jsdom)
pnpm test:backend     # Backend tests only (runs pnpm generate first)
pnpm test:frontend    # Frontend tests only

# Code Quality
pnpm lint             # ESLint on all TS/TSX files
pnpm generate         # Generate Drizzle migrations from models/

# Infrastructure
docker compose up     # Start Postgres, Redis, Azurite locally
```

## Architecture Overview

### RPC System (Core Innovation)

The custom RPC system eliminates traditional REST API development:

1. **Backend**: Export any function in `svc/` and it becomes an endpoint via Express middleware
2. **Build Time**: Vite plugin (`lib/rpc/vite-plugin.ts`) intercepts `@agape/*` imports and generates virtual RPC client modules
3. **Frontend**: Import and call backend functions directly with full TypeScript types

```typescript
// Frontend usage - calls POST to /svc/users/getUser with MessagePack serialization
import { getUser } from "@agape/svc/users";
const user = await getUser(userId);
```

### Directory Structure

- `web/` - React frontend (Vite root, entry: `web/index.tsx`)
- `svc/` - RPC handlers (exported functions = endpoints)
- `models/` - Drizzle ORM schemas (drive migrations)
- `lib/` - Shared code: RPC plumbing, DB utilities, services (storage, mail, cache), access/auth
- `bin/` - Entry points: `index.ts` (server), `build.ts` (bundler)

### File-Based Routing (Frontend)

Similar to Next.js App Router in `web/app/`:
- `page.tsx` defines a route
- `_layout.tsx` wraps child routes
- `[param]` for dynamic segments (e.g., `users/[id]/page.tsx` → `/users/:id`)

### Database Pattern: Class Table Inheritance (CTI)

The domain model uses CTI for entity inheritance:
- Base table (e.g., `user`) contains common attributes
- Child tables (e.g., `crm_client`) share the same PK as FK to parent
- Example: A client IS-A user, so `crm_client.id` = FK to `user.id`

Domains: core, security, crm, inventory, catalog, purchasing, finance, hr, numbering

## Path Aliases

**Backend** (`tsconfig.app.json`):
- `#lib/*`, `#models/*`, `#svc/*`, `#session`, `#logger`

**Frontend** (`tsconfig.web.json`):
- `@agape/*` (RPC virtual modules), `@/*` (web/ root)

## Coding Conventions

- TypeScript strict mode, ESM throughout
- Double quotes, semicolons, 2-space indentation
- React components in PascalCase, hooks start with `use`, utilities in camelCase
- Colocate tests as `*.test.ts`/`*.test.tsx` near source files
- Mocks in `web/test/mocks/`
- Commit prefixes: `feat:`, `fix:`, `chore:`, `refactor:`

## Environment Variables

Set in `bin/index.ts` (use `.env` locally, never commit secrets):

```
NODE_ENV, PORT=3000
AGAPE_HOOK, AGAPE_SECRET, AGAPE_ADMIN, AGAPE_PASSWORD, AGAPE_TENANT
DATABASE_URI=postgresql://postgres:mypassword@localhost
CACHE_URL=redis://localhost:6379
AZURE_CONNECTION_STRING=UseDevelopmentStorage=true
```

## Key Technical Details

- MessagePack for RPC serialization (requires `Accept: application/msgpack` header)
- Form system uses Redux-backed store with `path` declarations, `materialize`, and `autoCleanup` options
- Drizzle Kit generates migrations to `lib/db/migrations/scripts`
- Multi-tenant via database schema namespacing (e.g., `agape_app_development_demo`)
