/**
 * Socket Namespace Manager
 *
 * Provides a type-safe abstraction for Socket.IO namespaces on the server.
 * Each NamespaceManager instance handles a single namespace and uses
 * internal symbols to scope events, preventing conflicts between namespaces.
 *
 * The manager uses msgpack for efficient binary serialization of event data.
 *
 * @example
 * // In svc/notifications/socket.ts
 * type Events = {
 *     "notification:new": { id: string; message: string };
 *     "notification:read": { id: string };
 * };
 *
 * export default registerNamespace<Events>();
 */

import mitt from "mitt";
import type { ConnectedSocket, EventMap } from "../utils/socket";
import type { Namespace } from "socket.io";
import { encode, decode } from "../utils/msgpack";

// ============================================================================
// Types
// ============================================================================

/** Internal event emitter for cross-socket communication */
const emitter = mitt();

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
            // Emit connection event via mitt
            const connectEvent = this.getOrRegisterInternalEvent("socket:connect");
            emitter.emit(connectEvent, {});

            // Handle disconnection
            socket.on("disconnect", () => {
                const disconnectEvent = this.getOrRegisterInternalEvent("socket:disconnect");
                emitter.emit(disconnectEvent, {});
            });

            // Use onAny to capture all events from this socket
            socket.onAny((event: string, data: unknown) => {
                const internalEvent = this.getOrRegisterInternalEvent(event);

                // Decode msgpack if binary data, otherwise pass through
                if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
                    const decoded = decode(data as Uint8Array);
                    // Standard Socket.IO emit with msgpackr wraps args in an array [payload]
                    emitter.emit(internalEvent, Array.isArray(decoded) ? decoded[0] : decoded);
                } else {
                    emitter.emit(internalEvent, data);
                }
            });
        });
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
     *
     * @param event - The event name to listen for
     * @param handler - Callback function to handle the event
     */
    on(event: string, handler: (data: unknown) => void): void {
        const internalEvent = this.getOrRegisterInternalEvent(event);
        emitter.on(internalEvent, handler);
    }

    /**
     * Unsubscribes from an event.
     *
     * @param event - The event name to stop listening for
     * @param handler - The specific handler to remove (optional)
     */
    off(event: string, handler?: (data: unknown) => void): void {
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
 * @template Events - Type map of event names to their payload types
 * @returns A type-safe namespace manager
 *
 * @example
 * // Define your events
 * type ChatEvents = {
 *     "message:new": { userId: string; text: string; timestamp: Date };
 *     "user:typing": { userId: string };
 *     "user:joined": { userId: string; username: string };
 * };
 *
 * // Create and export the namespace
 * export default registerNamespace<ChatEvents>();
 */
export function registerNamespace<Events extends EventMap>(): ConnectedSocket<Events> {
    return new NamespaceManager() as unknown as ConnectedSocket<Events>;
}