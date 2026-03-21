/**
 * Unified Context Store
 *
 * Provides AsyncLocalStorage-based context management for both HTTP and Socket.IO handlers.
 * This single store replaces the separate stores previously used for RPC and Socket contexts.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { IContext } from "./types";

/**
 * Single AsyncLocalStorage instance for all contexts.
 * Both HTTP requests and Socket.IO event handlers use this same store.
 */
const als = new AsyncLocalStorage<IContext>();

/**
 * Runs a callback within a context.
 * Creates a fresh session Map for each execution.
 *
 * @param ctx - The context to run within
 * @param callback - The function to execute within the context
 * @returns The result of the callback
 *
 * @example
 * ```typescript
 * const context: IContext = {
 *   id: userId,
 *   tenant: "default",
 *   permissions: ["admin"],
 *   session: new Map(),
 *   source: "http",
 * };
 *
 * await runContext(context, async () => {
 *   // ctx.id is now available
 *   await handleRequest();
 * });
 * ```
 */
export function runContext<T>(
  ctx: IContext,
  callback: () => T | Promise<T>,
): T | Promise<T> {
  return als.run({ ...ctx, session: new Map() }, callback);
}

/**
 * Gets the current context store.
 * Throws if no context is active.
 *
 * @throws Error if called outside of a runContext callback
 * @returns The current context
 */
export function getStore(): IContext {
  const store = als.getStore();

  if (!store) {
    throw new Error(
      "Cannot access context outside of a request scope. " +
        "Ensure this code runs within runContext() " +
        "(RPC handler or Socket.IO event).",
    );
  }

  return store;
}

/**
 * Gets the current context store or null if not active.
 * Use this when context availability is optional.
 *
 * @returns The current context or null
 */
export function getStoreOrNull(): IContext | null {
  return als.getStore() ?? null;
}

/**
 * Checks if a context is currently active.
 *
 * @returns true if running within a context
 */
export function hasContext(): boolean {
  return als.getStore() !== undefined;
}

/**
 * Asserts that a context is currently active and returns it.
 *
 * Use this in service functions to explicitly verify they are running
 * within a request scope. Provides a clear error when the assertion fails,
 * making debugging easier during development.
 *
 * @throws Error if called outside of a runContext callback
 * @returns The current context
 *
 * @example
 * ```typescript
 * import { assertContext } from "#lib/context";
 *
 * export async function sensitiveOperation() {
 *   const ctx = assertContext();
 *   // ctx is guaranteed to be a valid IContext here
 * }
 * ```
 */
export function assertContext(): IContext {
  const store = getStoreOrNull();
  if (!store) {
    throw new Error(
      "Context assertion failed: not running within a request scope.",
    );
  }
  return store;
}
