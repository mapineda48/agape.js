# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agape.js is a single-tenant-per-deployment simple ERP built with TypeScript. It has a unified codebase with an Express/Node.js backend and a React/Vite frontend, communicating via a custom zero-boilerplate RPC system with MessagePack serialization.

## Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm app                    # Run backend server (tsx watch, port 3000)
pnpm web                    # Run Vite dev server for frontend (port 5173)

# Testing
pnpm vitest                 # Run all tests (app + frontend projects)
pnpm vitest --project app   # Run backend tests only (lib/, services/)
pnpm test:web               # Run frontend tests only (web/)
pnpm vitest run path/to/file.test.ts  # Run a single test file

# Build
pnpm vite build             # Build frontend (outputs to dist/web/www/)
pnpm tsc -b                 # TypeScript compilation
tsx bin/build.ts             # Post-build script (fix ESM extensions, copy assets, generate permissions)

# Database
pnpm drizzle-kit generate   # Generate migration SQL from models
pnpm drizzle-kit push        # Push schema changes directly

# Linting
pnpm eslint .

# Infrastructure (dev)
docker compose up -d        # Start PostgreSQL, Redis, Azurite, pgAdmin
```

## Architecture

### Directory Structure

- **`bin/`** - Entry points: `index.ts` (server), `build.ts` (post-build), `env.ts` (environment config)
- **`lib/`** - Core framework libraries (RPC, database, auth, context, socket, vite plugin)
- **`models/`** - Drizzle ORM database models (PostgreSQL)
- **`services/`** - Backend business logic, auto-discovered as RPC endpoints
- **`shared/`** - Code shared between frontend and backend (types, msgpack codecs, RBAC)
- **`web/`** - React frontend with file-based routing
- **`web/app/`** - Pages (`page.tsx`) and layouts (`_layout.tsx`), supports `[param]` dynamic routes

### TypeScript Configs

Three separate tsconfig targets:
- `tsconfig.app.json` - Backend (Node.js, ESNext, `moduleResolution: node`)
- `tsconfig.web.json` - Frontend (DOM, React JSX, `moduleResolution: bundler`)
- `tsconfig.node.json` - Vite/build tooling

### Path Aliases

Backend (`tsconfig.app.json`): `#models/*`, `#lib/*`, `#svc/*`, `#shared/*`
Frontend (`tsconfig.web.json`): `#web/*`, `#shared/*`, `#services/*`
Vite resolves: `#web` → `web/`, `#shared` → `shared/`

### RPC System (`lib/rpc/`)

Services in `services/` are auto-discovered and exposed as HTTP endpoints. Frontend imports them as virtual modules (`@agape/<service>`). The Vite plugin (`lib/vite/`) generates client code at dev/build time.

- **Security via JSDoc tags** on exported functions:
  - No tag = requires authentication
  - `@public` = no auth required
  - `@permission <name>` = specific permission required
- Requests use MessagePack encoding with custom extensions for `DateTime`, `Decimal`, and `File`
- File uploads handled via multipart FormData with MessagePack-encoded args

### Database (`lib/db/`)

- **Drizzle ORM** with PostgreSQL
- Multi-tenant via separate PostgreSQL schemas per tenant
- Models use **Class Table Inheritance (CTI)** pattern for entity hierarchies
- Custom column types: `DateTime` (date-fns), `Decimal` (decimal.js), `AddressSnapshot`
- Migrations tracked in `agape` table with PostgreSQL advisory locks
- Schema files in `models/`, migration SQL in `lib/db/migrations/scripts/`

### Context System (`lib/context/`)

Uses `AsyncLocalStorage` for request-scoped context. Both HTTP and Socket.IO handlers share the same `IContext` interface providing `id`, `tenant`, `permissions`, and a per-request session Map.

### Socket.IO (`lib/socket/`)

Real-time communication via namespaces. Services export `NamespaceManager` instances alongside RPC functions. Uses Redis adapter for horizontal scaling. Auth via JWT in cookies.

### Frontend (`web/`)

- **File-based router**: `web/app/**/page.tsx` for pages, `_layout.tsx` for layouts
- **Zustand** for state management
- **React Compiler** enabled (babel-plugin-react-compiler)
- **Form system**: Zustand state + Zod validation with `Form.Root`, `Form.Field`, `Form.Scope`, `Form.Array` components
- `onInit` export on pages for data loading before render
- `useRouter` hook for navigation (absolute, layout-relative, relative modes)

### Testing

Vitest with two projects configured in `vitest.config.ts`:
- **`app`**: Node environment, tests in `lib/**/*.test.ts` and `svc/**/*.test.ts`, limited concurrency (3 workers, 30s timeout) due to PostgreSQL
- **`frontend`**: jsdom environment, tests in `web/**/*.test.{ts,tsx}`, setup file at `web/__test__/setup.ts`, service mocks at `web/__test__/mocks/services/`

### Deployment

- Docker multi-stage build (Node 22, pnpm)
- Production entry: `node bin/index.js`
- Infrastructure: PostgreSQL, Redis, Azure Blob Storage (Azurite for dev)
- Environment variables defined in `bin/env.ts` with sensible dev defaults

## Conventions

- Use `DateTime` (from `shared/data/`) instead of raw `Date` objects
- Use `Decimal` (from `shared/data/`) instead of `number` for monetary/precise values
- Services follow canonical flow: input → transaction → hydration → validation → execution → return
- RBAC permissions are hierarchical with wildcard support (e.g., `sales.*`)
- The `.agent/rules/` directory contains detailed rules for RPC, services, models, routing, and forms
