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

import type { IContext } from "./types";
import { getStore } from "./store";

/**
 * Context proxy for convenient access.
 *
 * This proxy automatically retrieves values from the current AsyncLocalStorage store,
 * providing a singleton-like API for request-scoped data.
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

// Re-export types and utilities
export type { IContext, ContextSource, UserPayload } from "./types";
export { runContext, getStore, getStoreOrNull, hasContext } from "./store";
