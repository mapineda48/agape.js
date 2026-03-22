/**
 * Unified Context Types
 *
 * Defines the shared context interface used by both HTTP (RPC) and Socket.IO handlers.
 * This unified approach allows services to be called from either context without
 * needing to pass context explicitly through parameters.
 */

import type { Socket } from "socket.io";

/**
 * Context source identifier.
 * Indicates whether the current context originated from an HTTP request or Socket.IO connection.
 */
export type ContextSource = "http" | "socket";

/**
 * Unified context interface for HTTP and Socket.IO handlers.
 *
 * All handlers (RPC endpoints and socket event handlers) share this context,
 * enabling seamless service composition where a socket handler can call
 * an RPC service function without explicitly passing context.
 *
 * @example
 * ```typescript
 * import ctx from "#lib/context";
 *
 * // Works in both HTTP and Socket contexts
 * export async function createOrder(data: OrderData) {
 *   const userId = ctx.id;
 *
 *   // Check if we're in a socket context
 *   if (ctx.source === "socket" && ctx.socket) {
 *     ctx.socket.emit("order:created", result);
 *   }
 * }
 * ```
 */
export interface IContext {
  /** Tenant identifier (constant in single-tenant design) */
  readonly tenant: string;

  /** User ID (0 = unauthenticated) */
  id: number;

  /** User's permissions array */
  permissions: string[];

  /** Per-request/connection session storage */
  session: Map<unknown, unknown>;

  /** Context origin: "http" for RPC requests, "socket" for Socket.IO events */
  readonly source: ContextSource;

  /**
   * Socket.IO socket instance.
   * Only present when source === "socket".
   */
  socket?: Socket;
}

/**
 * User payload from JWT token or authentication.
 * Used to create context from auth data.
 */
export interface UserPayload {
  id: number;
  tenant: string;
  permissions: string[];
  [key: string]: unknown;
}
