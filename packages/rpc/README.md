# @mapineda48/agape-rpc

Type-safe RPC and real-time communication framework with MessagePack serialization.

Published to [GitHub Packages](https://github.com/mapineda48/agape.js/packages) under the `@mapineda48` scope.

## Installation

Configure your `.npmrc` to use GitHub Packages for the `@mapineda48` scope:

```
@mapineda48:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install @mapineda48/agape-rpc
```

## Key Features

- **Auto-discovery server middleware** -- scans a services directory and registers RPC handlers on Express.
- **MessagePack serialization** with custom extensions for DateTime, Decimal, File, and Error types.
- **Socket.IO typed events** -- type-safe real-time communication with `ConnectedSocket<Events>`.
- **Vite plugin** -- generates virtual client modules (`#services/...`) from service contracts.
- **Zod validation** -- `withValidation()` decorator for runtime argument validation on endpoints.

## Server

### `initRpc(servicesDir, options): Promise<RpcEngine>`

High-level facade that initializes the entire RPC system. Returns an Express middleware, the discovered module map, and service discovery utilities.

```ts
import { initRpc } from "@mapineda48/agape-rpc/server";
import { servicesDir } from "@mapineda48/agape-core";

const rpc = await initRpc(servicesDir, {
  createContext: (auth) => ({ id: auth?.id ?? 0 }),
  runContext: (ctx, fn) => fn(),
  permissionValidator: validatePermission, // optional
  logger: customLogger,                    // optional
});

app.use(rpc.middleware);
```

### Socket.IO Support

Server-side socket namespaces are managed with `NamespaceManager` and discovered automatically via `discoverSocketNamespaces()`:

```ts
import { discoverSocketNamespaces, registerNamespace, configureSocketContext } from "@mapineda48/agape-rpc/server";
```

## Client

Client modules are generated automatically by the Vite plugin. Application code imports them as virtual modules:

```ts
import { greet } from "#services/public";
// greet() is a typed async function that calls the RPC endpoint over HTTP.

import chat from "#services/chat";
// chat.connect() returns a typed ConnectedSocket<ChatEvents>.
```

Under the hood, the generated code uses:

- **`makeRpc(pathname)`** -- creates an HTTP client function that serializes arguments with MessagePack and sends them via `fetch`.
- **`makeSocket(namespace)`** -- creates a Socket.IO client factory with automatic MessagePack decoding.

## Vite Plugin

```ts
// vite.config.ts
import { createVitePlugin } from "@mapineda48/agape-rpc/vite/plugin";
import { servicesDir } from "@mapineda48/agape-core";

export default defineConfig({
  plugins: [createVitePlugin(servicesDir)],
});
```

The plugin scans the service contracts at build time, then resolves `#services/*` imports to generated client code.

## Data Types

Custom data types that survive MessagePack serialization round-trips.

### DateTime (`@mapineda48/agape-rpc/data/DateTime`)

Extends `Date` with convenience methods powered by date-fns:

- `addHours(n)`, `addDays(n)`
- `isBefore(date)`, `isAfter(date)`
- `diffInHours(date)`, `diffInMinutes(date)`
- `clone()`

### Decimal (`@mapineda48/agape-rpc/data/Decimal`)

Extends `decimal.js` with Colombian locale defaults (precision 20, ROUND_HALF_UP). Serializes to two decimal places in JSON.

### File (`@mapineda48/agape-rpc/data/File`)

Browser `File` objects are automatically extracted from RPC arguments, sent as multipart form data, and reassembled on the server via formidable.

### Error (`@mapineda48/agape-rpc/data/Error`)

Error instances are serialized and deserialized through MessagePack so that server errors propagate to the client with their message intact.

## MessagePack (`@mapineda48/agape-rpc/msgpackr`)

Provides `encode(value)` and `decode(buffer)` functions with all custom extensions pre-registered. Used internally by both client and server.

## Peer Dependencies

All peer dependencies are optional. Install only those you need:

| Package              | Required for                      |
|----------------------|-----------------------------------|
| `express` ^5         | Server middleware                 |
| `formidable` ^3      | File upload handling              |
| `socket.io` ^4       | Server-side socket namespaces     |
| `socket.io-client` ^4| Client-side socket connections    |
| `vite` ^7            | Virtual module plugin             |

## License

See the repository root for license information.
