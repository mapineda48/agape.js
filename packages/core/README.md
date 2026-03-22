# @mapineda48/agape-core

Shared types, service contracts, and RBAC catalog for the agape.js framework.

Published to [GitHub Packages](https://github.com/mapineda48/agape.js/packages) under the `@mapineda48` scope.

## Installation

Configure your `.npmrc` to use GitHub Packages for the `@mapineda48` scope:

```
@mapineda48:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install @mapineda48/agape-core
```

## Exports

### Root (`@mapineda48/agape-core`)

- **`servicesDir`** -- Absolute path to the `services/` directory. Pass this to the Vite plugin or RPC server to enable auto-discovery of endpoints and socket namespaces.

### Security (`@mapineda48/agape-core/security/*`)

Type definitions for authentication and authorization payloads, and route-level security configuration.

### RBAC (`@mapineda48/agape-core/rbac/catalog`)

Permission catalog defining all RBAC permissions used across the application.

### Service Contracts (`@mapineda48/agape-core/services/*`)

Service contract files declare the shape of backend services without containing any implementation. They live in the `services/` directory and follow two conventions:

- **Exported functions** become RPC endpoints. The function signature defines the request/response types.
- **`socketContract<Events>()`** exports become Socket.IO namespaces with typed events.

Available contracts:

| Module   | Description                        |
|----------|------------------------------------|
| `chat`   | Real-time chat via Socket.IO       |
| `public` | Unauthenticated RPC endpoints      |
| `web`    | Authenticated web RPC endpoints    |

#### Example: defining a contract

```ts
// services/public.ts
export function greet(name: string): string {
  // Implementation lives in the backend; this is just the type signature.
  return null as any;
}
```

```ts
// services/chat.ts
import { socketContract } from "./contract";

export type ChatEvents = {
  "message:send": { text: string; sender: string };
  "message:received": ChatMessage;
};

const socket = socketContract<ChatEvents>();
export default socket;
```

The Vite plugin and RPC server use `servicesDir` to discover these files and generate client stubs or register handlers automatically.

## License

See the repository root for license information.
