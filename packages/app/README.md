# @mapineda48/agape-app

Express 5 backend server with auto-discovered RPC endpoints, PostgreSQL, Socket.IO, and RBAC.

## Installation

```bash
npm install -g @mapineda48/agape-app --registry=https://npm.pkg.github.com
```

Or via Docker:

```bash
docker pull ghcr.io/mapineda48/agape.js:latest
```

Installs globally as the `agape-app` command.

## Features

- **Auto-discovered RPC services** -- modules in `services/` are registered automatically
- **JWT authentication**
- **RBAC with JSDoc permission tags** (`@public`, `@permission admin.users.read`)
- **PostgreSQL with Drizzle ORM** using Class Table Inheritance
- **Socket.IO** with Redis adapter for scalable real-time events
- **Azure Blob Storage** integration
- **SSR/SSG** via `@mapineda48/agape-web`
- **AsyncLocalStorage** for per-request context

## Architecture

Services in the `services/` directory are auto-discovered at startup. Access control is declared via JSDoc tags on service methods:

```ts
/**
 * @public
 */
export function getPublicData() { ... }

/**
 * @permission admin.users.read
 */
export function listUsers() { ... }
```

Request context is available through `AsyncLocalStorage`, providing the authenticated user and tenant information within any service call.

## Environment Variables

| Variable | Description |
|---|---|
| `NODE_ENV` | Runtime environment (`development`, `production`) |
| `PORT` | HTTP listen port |
| `DATABASE_URI` | PostgreSQL connection string |
| `CACHE_URL` | Redis connection URL |
| `AZURE_CONNECTION_STRING` | Azure Blob Storage connection string |
| `AGAPE_SECRET` | JWT signing secret |
| `AGAPE_ADMIN` | Default admin username |
| `AGAPE_PASSWORD` | Default admin password |
| `AGAPE_TENANT` | Default tenant identifier |
| `AGAPE_CDN_HOST` | CDN host for static assets |
| `RESEND_API_KEY` | Resend email API key (optional) |

## Development

```bash
pnpm dev
```

Runs the server in watch mode via `tsx`.

## Module Resolution

Uses `moduleResolution: NodeNext` (standard Node.js ESM).

## Distribution

Published to GitHub Packages under the `@mapineda48` scope.
