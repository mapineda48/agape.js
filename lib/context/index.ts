/**
 * Unified Context Module
 *
 * Provides request-scoped context for both HTTP (RPC) and Socket.IO handlers.
 * Uses AsyncLocalStorage to make context available throughout the call stack
 * without explicit parameter passing.
 *
 * @example
 * ```typescript
 * import ctx from "#lib/context";
 *
 * // Access context in any function within the request/event scope
 * export async function getOrdersByUser() {
 *   const userId = ctx.id;
 *   const permissions = ctx.permissions;
 *
 *   // Check context source if needed
 *   if (ctx.source === "socket") {
 *     ctx.socket?.emit("orders:loading", { userId });
 *   }
 *
 *   return await db.query.orders.findMany({
 *     where: eq(orders.userId, userId),
 *   });
 * }
 * ```
 */

import type { Socket } from "socket.io";
import type { IContext } from "./types";
import { getStore } from "./store";

/**
 * Context proxy for convenient access.
 *
 * **How it works:** This proxy is backed by Node.js `AsyncLocalStorage`.
 * Each property access (e.g. `ctx.id`) is forwarded to the store that was
 * established for the current async execution via `runContext()`.
 *
 * **When it throws:** Accessing any property on this proxy outside of a
 * `runContext()` call will throw an error. This typically means the code
 * is running outside of a request/event handler.
 *
 * **Where the context is set up:**
 * - **RPC middleware** — wraps every HTTP request in `runContext()` with
 *   source `"http"`.
 * - **Socket.IO middleware** — wraps every socket event handler in
 *   `runContext()` with source `"socket"` and the `socket` instance attached.
 *
 * Usage:
 * - `ctx.id` - Get user ID
 * - `ctx.permissions` - Get user permissions array
 * - `ctx.tenant` - Get tenant identifier
 * - `ctx.source` - Get context source ("http" | "socket")
 * - `ctx.socket` - Get Socket.IO socket (only in socket context)
 * - `ctx.session` - Get per-request session Map
 */
const ctx: unknown = new Proxy({} as IContext, {
  get(_target, key, receiver) {
    const store = getStore();
    return Reflect.get(store, key, receiver);
  },
  set(_target, key: string, value: unknown) {
    const store = getStore();
    return Reflect.set(store, key, value, store);
  },
});

export default ctx as IContext;

/**
 * A narrowed context type where `source` is `"socket"` and `socket` is guaranteed.
 */
export interface ISocketContext extends IContext {
  readonly source: "socket";
  socket: Socket;
}

/**
 * Type guard that narrows the context to a Socket.IO context.
 *
 * When this returns `true`, the context is guaranteed to have `source === "socket"`
 * and a non-undefined `socket` property.
 *
 * @example
 * ```typescript
 * import ctx, { isSocketContext } from "#lib/context";
 *
 * if (isSocketContext(ctx)) {
 *   ctx.socket.emit("update", data); // socket is typed as Socket, not Socket | undefined
 * }
 * ```
 */
export function isSocketContext(context: IContext): context is ISocketContext {
  return context.source === "socket" && context.socket !== undefined;
}

// Re-export types and utilities
export type { IContext, ContextSource, UserPayload } from "./types";
export {
  runContext,
  getStore,
  getStoreOrNull,
  hasContext,
  assertContext,
} from "./store";
