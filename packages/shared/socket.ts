/**
 * Socket Type Definitions
 *
 * Provides type-safe interfaces for Socket.IO communication.
 * These types are shared between server (NamespaceManager) and
 * client (createSocketClient) to ensure consistent event contracts.
 *
 * @module @utils/socket
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Base type for event maps.
 * Maps event names to their payload types.
 *
 * @example
 * type MyEvents = {
 *     "user:login": { userId: string; timestamp: Date };
 *     "user:logout": void;  // Event with no payload
 *     "data:update": { items: string[] };
 * };
 */
export type EventMap = Record<string, void | unknown>;

/**
 * Extracts string keys from an EventMap.
 * Used internally for type-safe event name handling.
 */
type Key<E extends EventMap> = Extract<keyof E, string>;

/**
 * Determines the emit arguments for a given event.
 * - Events with `void` payload require no arguments
 * - Events with other payloads require exactly one argument
 */
type EmitArgs<E extends EventMap, K extends Key<E>> = E[K] extends void
  ? []
  : [payload: E[K]];

/**
 * Determines the handler signature for a given event.
 * - Events with `void` payload have handlers with no parameters
 * - Events with other payloads have handlers that receive the payload
 */
type Handler<E extends EventMap, K extends Key<E>> = E[K] extends void
  ? () => void
  : (payload: E[K]) => void;

// ============================================================================
// Socket Interfaces
// ============================================================================

/**
 * Type-safe socket interface for real-time communication.
 *
 * This interface is implemented differently on server and client:
 * - Server: NamespaceManager (lib/socket/namespace.ts)
 * - Client: createSocketClient (web/utils/socket.ts)
 *
 * The `connect()` method is only available on the client side and
 * is used to establish the WebSocket connection.
 *
 * @template Events - Type map of event names to their payload types
 *
 * @example
 * // Import the socket from a virtual module
 * import socket from "@agape/notifications/socket";
 *
 * // Connect and use type-safe events
 * const connection = socket.connect();
 *
 * connection.on("notification:new", (payload) => {
 *     // TypeScript knows the payload type!
 *     console.log(payload.message);
 * });
 *
 * connection.emit("notification:read", { id: "123" });
 *
 * // Cleanup
 * connection.disconnect();
 */
export interface ConnectedSocket<Events extends EventMap> {
  /**
   * Disconnects from the socket server.
   * After calling this, no more events will be received.
   */
  disconnect(): void;

  /**
   * Subscribes to a specific event.
   *
   * @param event - The event name to listen for
   * @param handler - Callback function invoked when the event is received
   * @returns Cleanup function to unsubscribe from the event
   *
   * @example
   * const unsubscribe = socket.on("message", (data) => console.log(data));
   * // Later...
   * unsubscribe();
   */
  on<K extends Key<Events>>(event: K, handler: Handler<Events, K>): () => void;

  /**
   * Unsubscribes from a specific event.
   *
   * @param event - The event name to stop listening for
   * @param handler - Optional specific handler to remove. If omitted, removes all handlers.
   */
  off<K extends Key<Events>>(event: K, handler?: Handler<Events, K>): void;

  /**
   * Emits an event to the server (client) or all clients (server).
   *
   * @param event - The event name to emit
   * @param args - The payload to send (type-checked based on event)
   *
   * @example
   * socket.emit("user:action", { action: "click", target: "button" });
   */
  emit<K extends Key<Events>>(event: K, ...args: EmitArgs<Events, K>): void;

  /**
   * Establishes the WebSocket connection.
   *
   * **Note**: This method is only available on the browser client.
   * Server-side NamespaceManager instances are connected automatically.
   *
   * @returns A connected socket without the `connect` method
   */
  connect(): Omit<ConnectedSocket<Events>, "connect">;
}
