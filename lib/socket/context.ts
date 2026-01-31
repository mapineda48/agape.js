/**
 * Socket Context Module
 *
 * Provides socket-specific context utilities that wrap the unified context system.
 * This module bridges Socket.IO connections with the unified context, allowing
 * socket handlers to call RPC services seamlessly.
 *
 * @example
 * ```typescript
 * import ctx from "#lib/context";
 * import { attachUserToSocket } from "#lib/socket/context";
 *
 * // In socket handler:
 * const userId = ctx.id;        // Works!
 * const socket = ctx.socket;    // Socket instance available
 *
 * // Call an RPC service directly:
 * await orderService.createOrder(data);  // ctx.id works inside!
 * ```
 */

import type { Socket } from "socket.io";
import { runContext, type IContext, type UserPayload } from "#lib/context";

// Re-export UserPayload as SocketUserPayload for backwards compatibility
export type SocketUserPayload = UserPayload;

/**
 * Extended socket data interface.
 * Stores user and context on the socket instance for persistence across events.
 */
export interface SocketData {
  user?: SocketUserPayload;
  context?: IContext;
}

/**
 * Creates a socket context from user payload.
 * Uses the unified IContext with source="socket" and socket instance attached.
 *
 * @param socket - The Socket.IO socket instance
 * @param user - User payload from authentication (null for unauthenticated)
 * @returns Unified context with socket-specific properties
 */
export function createSocketContext(
  socket: Socket,
  user?: SocketUserPayload | null,
): IContext {
  return {
    tenant: user?.tenant ?? "",
    id: user?.id ?? 0,
    permissions: user?.permissions ?? [],
    socket,
    session: new Map(),
    source: "socket",
  };
}

/**
 * Runs a callback within a socket context.
 * Uses the unified runContext from #lib/context.
 *
 * This enables:
 * - Accessing ctx.id, ctx.permissions in socket handlers
 * - Calling RPC services from socket handlers (they'll see the same context)
 * - Accessing ctx.socket when source === "socket"
 *
 * @param context - The socket context
 * @param callback - The function to run within the context
 * @returns The result of the callback
 */
export function runSocketContext<T>(
  context: IContext,
  callback: () => T | Promise<T>,
): T | Promise<T> {
  return runContext(context, callback);
}

/**
 * Attaches user context to a socket for later retrieval.
 * Called during connection authentication.
 *
 * @param socket - The Socket.IO socket instance
 * @param user - User payload from JWT (null for unauthenticated/public namespaces)
 */
export function attachUserToSocket(
  socket: Socket,
  user?: SocketUserPayload | null,
): void {
  const socketData = socket.data as SocketData;
  socketData.user = user ?? undefined;
  socketData.context = createSocketContext(socket, user);
}

/**
 * Gets the user payload from a socket.
 *
 * @param socket - The Socket.IO socket instance
 * @returns User payload or null if not authenticated
 */
export function getUserFromSocket(socket: Socket): SocketUserPayload | null {
  const socketData = socket.data as SocketData;
  return socketData.user ?? null;
}

/**
 * Gets the context from a socket.
 * Returns the unified IContext stored on the socket during connection.
 *
 * @param socket - The Socket.IO socket instance
 * @returns Context or null if not attached
 */
export function getContextFromSocket(socket: Socket): IContext | null {
  const socketData = socket.data as SocketData;
  return socketData.context ?? null;
}

// ============================================================================
// Backwards Compatibility Exports
// ============================================================================

/**
 * @deprecated Use `import ctx from "#lib/context"` instead.
 * This export is maintained for backwards compatibility only.
 *
 * The unified context provides the same interface plus `source` field:
 * - ctx.id - User ID
 * - ctx.permissions - User permissions
 * - ctx.tenant - Tenant identifier
 * - ctx.socket - Socket instance (when source === "socket")
 * - ctx.source - "http" | "socket"
 */
import ctx from "#lib/context";
export default ctx;

/**
 * @deprecated Use `import { hasContext } from "#lib/context"` instead.
 */
export { hasContext as hasSocketContext } from "#lib/context";

/**
 * @deprecated Use `import { getStoreOrNull } from "#lib/context"` instead.
 */
export { getStoreOrNull as getSocketContextOrNull } from "#lib/context";

// Re-export IContext as ISocketContext for backwards compatibility
export type { IContext as ISocketContext } from "#lib/context";
