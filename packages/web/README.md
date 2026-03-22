# @mapineda48/agape-web

React 19 frontend with SSR/SSG support, file-based routing, and type-safe RPC integration.

## Stack

- Vite 7
- React 19 with React Compiler
- TypeScript

## Features

- **File-based routing** via the `app/` directory convention
- **SSR and SSG support** with a framework-agnostic SSR middleware
- **Form system** with built-in validation
- **Auto-generated RPC clients** via a custom Vite plugin
- **Socket.IO typed client** for real-time communication

## Server Exports

| Export | Description |
|---|---|
| `createViteServer()` | Creates a Vite dev server for local development |
| `createSSRMiddleware()` | Returns SSR middleware using generic HTTP interfaces (`SSRRequest`, `SSRResponse`) -- compatible with Express, Koa, or any Node.js HTTP framework |
| `paths` | Runtime path resolution for production asset lookup |

## Published Distribution

| Directory | Contents |
|---|---|
| `www/` | Client bundle |
| `ssr/` | SSR bundle |
| `server/` | Compiled server facades |
| `paths.js` | Runtime path resolution |

## Development

```bash
pnpm dev
```

Starts the Vite dev server on port 5173.

## Installation

Published to GitHub Packages under the `@mapineda48` scope.

```bash
npm install @mapineda48/agape-web --registry=https://npm.pkg.github.com
```
