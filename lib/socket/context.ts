/**
 * Socket Context Module
 *
 * Provides context management for Socket.IO connections.
 * Unlike HTTP requests which use AsyncLocalStorage, socket connections
 * are persistent, so context is stored in socket.data.
 *
 * This module provides utilities to:
 * - Store user context in socket connections
 * - Access the current socket's context during event handlers
 * - Run event handlers with proper context propagation
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { Socket } from "socket.io";
import type { SocketUserPayload } from "./rbac/authorization";

// ============================================================================
// Types
// ============================================================================

/**
 * Socket connection context, similar to IContext for HTTP.
 */
export interface ISocketContext {
  /** Tenant identifier */
  readonly tenant: string;
  /** User ID (0 = unauthenticated/public namespace) */
  id: number;
  /** User's permissions array */
  permissions: string[];
  /** The Socket.IO socket instance */
  socket: Socket;
  /** Per-connection session data */
  session: Map<unknown, unknown>;
}

/**
 * Extended socket data interface
 */
export interface SocketData {
  user?: SocketUserPayload;
  context?: ISocketContext;
}

// ============================================================================
// Context Storage
// ============================================================================

/**
 * AsyncLocalStorage for socket event handlers.
 * Allows accessing the current socket context during event processing.
 */
const socketAls = new AsyncLocalStorage<ISocketContext>();

/**
 * Creates a socket context from user payload.
 */
export function createSocketContext(
  socket: Socket,
  user?: SocketUserPayload | null,
): ISocketContext {
  return {
    tenant: user?.tenant ?? "",
    id: user?.id ?? 0,
    permissions: user?.permissions ?? [],
    socket,
    session: new Map(),
  };
}

/**
 * Runs a callback within a socket context.
 * Use this when handling socket events to ensure context is available.
 *
 * @param context - The socket context
 * @param callback - The function to run within the context
 * @returns The result of the callback
 */
export function runSocketContext<T>(
  context: ISocketContext,
  callback: () => T | Promise<T>,
): T | Promise<T> {
  return socketAls.run(context, callback);
}

/**
 * Gets the current socket context.
 * Must be called within a runSocketContext callback.
 *
 * @throws Error if no socket context is active
 */
function getStore(): ISocketContext {
  const store = socketAls.getStore();

  if (!store) {
    throw new Error(
      "No hay contexto de socket activo (¿faltó runSocketContext en el handler?)",
    );
  }

  return store;
}

/**
 * Socket context proxy for convenient access.
 * Similar to the HTTP context pattern but for sockets.
 *
 * Usage:
 * ```typescript
 * import socketCtx from "#lib/socket/context";
 *
 * socket.on("message", async (payload) => {
 *   const userId = socketCtx.id;
 *   const socket = socketCtx.socket;
 *   // ...
 * });
 * ```
 */
const socketCtx: unknown = new Proxy({} as ISocketContext, {
  get(_target, key, receiver) {
    const store = getStore();
    return Reflect.get(store, key, receiver);
  },
  set(_target, key: string, value: unknown) {
    const store = getStore();
    return Reflect.set(store, key, value, store);
  },
});

export default socketCtx as ISocketContext;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if a socket context is currently active.
 */
export function hasSocketContext(): boolean {
  return socketAls.getStore() !== undefined;
}

/**
 * Gets the current socket context if available, or null.
 */
export function getSocketContextOrNull(): ISocketContext | null {
  return socketAls.getStore() ?? null;
}

/**
 * Attaches user context to a socket for later retrieval.
 * Called during connection authentication.
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
 */
export function getUserFromSocket(socket: Socket): SocketUserPayload | null {
  const socketData = socket.data as SocketData;
  return socketData.user ?? null;
}

/**
 * Gets the context from a socket.
 */
export function getContextFromSocket(socket: Socket): ISocketContext | null {
  const socketData = socket.data as SocketData;
  return socketData.context ?? null;
}
