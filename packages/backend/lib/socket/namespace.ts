/**
 * Socket Namespace Manager
 *
 * Provides a type-safe abstraction for Socket.IO namespaces on the server.
 * Each NamespaceManager instance handles a single namespace and uses
 * internal symbols to scope events, preventing conflicts between namespaces.
 *
 * The manager uses msgpack for efficient binary serialization of event data.
 *
 * Features:
 * - User context propagation via AsyncLocalStorage
 * - Automatic msgpack encoding/decoding
 * - Type-safe event handling
 *
 * @example
 * // In services/notifications.ts
 * type Events = {
 *     "notification:new": { id: string; message: string };
 *     "notification:read": { id: string };
 * };
 *
 * // Create a public namespace (no auth required)
 * /** @public *\/
 * const socket = registerNamespace<Events>();
 *
 * // Create an authenticated namespace
 * const socket = registerNamespace<Events>();
 *
 * // Create a permission-protected namespace
 * /** @permission admin.notifications *\/
 * const socket = registerNamespace<Events>();
 *
 * export default socket;
 */

import EventEmitter from "node:events";
import type { Namespace, Socket } from "socket.io";
import { encode, decode } from "#shared/msgpackr";
import type { ConnectedSocket, EventMap } from "#shared/socket";
import type { IContext } from "#lib/context";
import { runSocketContext, getContextFromSocket } from "./context";

// ============================================================================
// Types
// ============================================================================

/** Internal event emitter for cross-socket communication */
const emitter = new EventEmitter();

/**
 * Event handler context passed to event callbacks.
 */
export interface EventHandlerContext {
  /** The socket that triggered the event */
  socket: Socket;
  /** User context (id, tenant, permissions) */
  context: IContext | null;
}

/**
 * Extended event handler that receives context.
 */
export type ContextAwareHandler<T = unknown> = (
  data: T,
  ctx: EventHandlerContext,
) => void | Promise<void>;

// ============================================================================
// Namespace Manager
// ============================================================================

/**
 * Manages a Socket.IO namespace with type-safe event handling.
 *
 * Features:
 * - Uses symbols for internal event routing to avoid naming conflicts
 * - Automatically decodes msgpack data from clients
 * - Encodes outgoing data with msgpack for efficient transmission
 * - Each instance has its own internal emitter for event isolation
 * - Propagates user context through AsyncLocalStorage
 */
export class NamespaceManager {
  /** Maps event names to internal symbols for scoped event handling */
  private internalEvents: Map<string, symbol>;

  /** The Socket.IO namespace instance */
  private nsp?: Namespace;

  constructor() {
    this.internalEvents = new Map<string, symbol>();
  }

  /**
   * Connects this manager to a Socket.IO namespace.
   * Sets up event listeners for all client connections.
   *
   * @param nsp - The Socket.IO namespace to manage
   * @throws Error if namespace is not provided or already connected
   */
  connect(nsp: Namespace): void {
    if (!nsp) {
      throw new Error("Namespace not provided");
    }

    if (this.nsp) {
      throw new Error("Namespace already connected");
    }

    this.nsp = nsp;

    // Handle new client connections
    this.nsp.on("connection", (socket) => {
      const context = getContextFromSocket(socket);

      // Emit connection event with context
      const connectEvent = this.getOrRegisterInternalEvent("socket:connect");
      this.emitInternalWithContext(connectEvent, {}, socket, context);

      // Handle disconnection
      socket.on("disconnect", () => {
        const disconnectEvent =
          this.getOrRegisterInternalEvent("socket:disconnect");
        this.emitInternalWithContext(disconnectEvent, {}, socket, context);
      });

      // Use onAny to capture all events from this socket
      socket.onAny((event: string, data: unknown) => {
        const internalEvent = this.getOrRegisterInternalEvent(event);

        // Decode msgpack if binary data, otherwise pass through
        let decodedData: unknown;
        if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
          const decoded = decode(data as Uint8Array);
          // Standard Socket.IO emit with msgpackr wraps args in an array [payload]
          decodedData = Array.isArray(decoded) ? decoded[0] : decoded;
        } else {
          decodedData = data;
        }

        this.emitInternalWithContext(internalEvent, decodedData, socket, context);
      });
    });
  }

  /**
   * Emits an internal event with proper context propagation.
   */
  private emitInternalWithContext(
    event: symbol,
    data: unknown,
    socket: Socket,
    context: IContext | null,
  ): void {
    const handlerContext: EventHandlerContext = { socket, context };

    if (context) {
      // Run within AsyncLocalStorage context
      runSocketContext(context, () => {
        emitter.emit(event, data, handlerContext);
      });
    } else {
      // No context (should not happen, but handle gracefully)
      emitter.emit(event, data, handlerContext);
    }
  }

  /**
   * Gets or creates an internal symbol for the given event name.
   * Symbols ensure event isolation between different namespaces.
   */
  private getOrRegisterInternalEvent(event: string): symbol {
    let internalEvent = this.internalEvents.get(event);

    if (!internalEvent) {
      internalEvent = Symbol(event);
      this.internalEvents.set(event, internalEvent);
    }

    return internalEvent;
  }

  /**
   * Subscribes to an event from connected clients.
   * The handler receives the event data and an optional context object.
   *
   * @param event - The event name to listen for
   * @param handler - Callback function to handle the event
   */
  on(event: string, handler: ContextAwareHandler): void {
    const internalEvent = this.getOrRegisterInternalEvent(event);
    emitter.on(internalEvent, handler);
  }

  /**
   * Unsubscribes from an event.
   *
   * @param event - The event name to stop listening for
   * @param handler - The specific handler to remove
   */
  off(event: string, handler: ContextAwareHandler): void {
    const internalEvent = this.getOrRegisterInternalEvent(event);
    emitter.off(internalEvent, handler);
  }

  /**
   * Emits an event to all connected clients in this namespace.
   * Data is automatically encoded with msgpack.
   *
   * @param event - The event name to emit
   * @param args - The data to send (will be msgpack encoded)
   */
  emit(event: string, ...args: unknown[]): void {
    this.nsp?.emit(event, encode(args));
  }

  /**
   * Gets the underlying namespace for advanced operations.
   */
  getNamespace(): Namespace | undefined {
    return this.nsp;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a type-safe namespace manager for Socket.IO.
 *
 * Use this function in service files to define WebSocket endpoints.
 * The returned object implements the ConnectedSocket interface for
 * type-safe event handling.
 *
 * Access Control (via JSDoc tags):
 * - No tag: Any authenticated user can connect
 * - @public: No authentication required
 * - @permission <name>: Specific permission required
 *
 * @template Events - Type map of event names to their payload types
 * @returns A type-safe namespace manager
 *
 * @example
 * // Public namespace (no auth required)
 * /** @public *\/
 * export const publicSocket = registerNamespace<Events>();
 *
 * // Authenticated namespace (any logged-in user)
 * export default registerNamespace<Events>();
 *
 * // Permission-protected namespace
 * /** @permission admin.dashboard *\/
 * export const adminSocket = registerNamespace<Events>();
 */
export function registerNamespace<
  Events extends EventMap,
>(): ConnectedSocket<Events> {
  return new NamespaceManager() as unknown as ConnectedSocket<Events>;
}
