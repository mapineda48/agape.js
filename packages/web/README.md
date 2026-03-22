# @mapineda48/agape-web

React 19 SPA frontend with file-based routing and type-safe RPC integration.

## Stack

- Vite 7
- React 19 with React Compiler
- TypeScript

## Features

- **File-based routing** via the `app/` directory convention
- **Form system** with built-in validation
- **Auto-generated RPC clients** via a custom Vite plugin
- **Socket.IO typed client** for real-time communication

## Server Exports

| Export | Description |
|---|---|
| `createViteServer()` | Creates a Vite dev server for local development |
| `paths` | Runtime path resolution for production asset lookup |

## Published Distribution

| Directory | Contents |
|---|---|
| `www/` | Client bundle |
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
