# agape.js

Full-stack TypeScript framework for ERP applications. Built with Express 5, React 19, PostgreSQL, and Redis in a pnpm monorepo.

## Monorepo Structure

```
agape.js/
├── packages/
│   ├── core/   # Shared types, data primitives, service contracts
│   ├── rpc/    # Zero-boilerplate RPC system (middleware + code generation)
│   ├── web/    # React 19 frontend (Vite 7, file-based routing, SSR/SSG)
│   └── app/    # Express 5 backend (server, models, services, CLI)
├── .agent/     # AI agent documentation and rules
└── package.json
```

## Package Overview

| Package | npm Scope | Purpose |
|---------|-----------|---------|
| `core` | `@mapineda48/agape-core` | Shared data types (DateTime, Decimal, File), service contracts, RBAC catalog, MessagePack serialization |
| `rpc` | `@mapineda48/agape-rpc` | RPC middleware, Vite virtual module plugin, auto-discovery of service endpoints |
| `web` | `@mapineda48/agape-web` | React frontend with file-based routing, form system, RPC client, Socket.IO client |
| `app` | `@mapineda48/agape-app` | Express server, Drizzle ORM models, service implementations, CLI entry point |

## Quick Start

### Prerequisites

- Node.js 22
- pnpm
- Docker (for infrastructure services)

### Development Setup

```bash
# Start infrastructure (PostgreSQL, Redis, Azurite)
docker compose up -d

# Install dependencies
pnpm install

# Run backend and frontend together
pnpm dev:app
```

You can also run the frontend dev server independently:

```bash
pnpm dev:web
```

### Build and Test

```bash
# Build all packages (core -> rpc -> web -> app)
pnpm build

# Type-check all packages
pnpm tsc

# Type-check individual packages
pnpm -C packages/app tsc
pnpm -C packages/web tsc

# Run all tests
pnpm test

# Lint
pnpm lint
pnpm lint:fix
```

## Production Deployment

### Docker Image

```bash
docker pull ghcr.io/mapineda48/agape.js
docker run -p 3000:3000 \
  -e DATABASE_URI=postgresql://user:pass@host/db \
  -e CACHE_URL=redis://host:6379 \
  ghcr.io/mapineda48/agape.js
```

### Global Install

```bash
npm install -g @mapineda48/agape-app
```

## Environment Variables

All environment variables are validated at startup via Zod (see `packages/app/bin/env.ts`).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` / `test` | Runtime environment |
| `PORT` | No | `3000` | HTTP server port |
| `DATABASE_URI` | No | `postgresql://postgres:mypassword@localhost` | PostgreSQL connection string |
| `CACHE_URL` | No | `redis://localhost:6379` | Redis connection URL (sessions, Socket.IO) |
| `AZURE_CONNECTION_STRING` | No | Azurite default | Azure Blob Storage connection string |
| `AGAPE_SECRET` | No | (dev default) | Secret key for session signing |
| `AGAPE_ADMIN` | No | `admin` | Default admin username |
| `AGAPE_PASSWORD` | No | `admin` | Default admin password |
| `AGAPE_TENANT` | No | `agape_app_development_demo` | Tenant database schema name |
| `AGAPE_CDN_HOST` | No | `http://127.0.0.1:10000` | CDN / blob storage host URL |
| `RESEND_API_KEY` | No | *(optional)* | Resend email service API key |

## Architecture Highlights

- **Zero-boilerplate RPC**: Backend functions in `services/` are automatically exposed as POST endpoints. No route definitions needed.
- **Type-safe contracts**: Service contracts (`.d.ts` files) in `packages/core` provide full type-checking between frontend and backend without importing Node.js-only code.
- **SSR/SSG support**: Vite-powered frontend with server-side rendering and static generation capabilities.
- **Socket.IO integration**: Real-time namespaces defined alongside RPC services with typed event contracts.
- **RBAC**: Role-based access control via JSDoc tags (`@public`, `@permission <name>`) with wildcard permission matching.
- **MessagePack serialization**: Binary transport via msgpackr for efficient RPC communication.
- **Custom data primitives**: `DateTime` (extends date-fns) and `Decimal` (wraps decimal.js) auto-serialize through the RPC layer.

## License

See [LICENSE](./LICENSE).

## Contributing

See [AGENTS.md](./AGENTS.md) for development guidelines and conventions.
