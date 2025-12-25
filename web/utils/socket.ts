/**
 * Socket.IO Client Factory
 *
 * Creates type-safe Socket.IO clients for real-time communication.
 * This module is used by virtual modules generated from socket.ts files.
 *
 * Features:
 * - Automatic msgpack decoding for efficient binary data transfer
 * - Type-safe event handling through ConnectedSocket interface
 * - Proper handler cleanup with WeakMap-based tracking
 * - Environment-aware URL configuration (dev vs production)
 *
 * @module @/utils/socket
 */

import { io } from "socket.io-client";
import { decode } from "@utils/msgpack";
import type { ConnectedSocket } from "@utils/socket";

// ============================================================================
// Configuration
// ============================================================================

/**
 * Base URL for Socket.IO connections.
 * - Development: Connects to Express server on port 3000
 * - Production: Uses the current page origin
 */
const BASE_URL =
    process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : location.origin;

// ============================================================================
// Types
// ============================================================================

/**
 * Factory interface returned by createSocketClient.
 * Calling connect() establishes the WebSocket connection.
 */
export interface SocketClientFactory {
    connect: () => Omit<ConnectedSocket<any>, "connect">;
}

// ============================================================================
// Internal Utilities
// ============================================================================

/**
 * Wraps an event handler to automatically decode msgpack data.
 *
 * Socket.IO may receive data as:
 * - Uint8Array/ArrayBuffer: Binary msgpack data from the server
 * - Other types: Already decoded JSON data
 *
 * @param handler - The original handler function
 * @returns Wrapped handler that decodes binary data
 */
function wrapEventHandler(handler: (data: unknown) => void): (data: unknown) => void {
    return (data: unknown) => {
        if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
            handler(decode(data as Uint8Array));
        } else {
            handler(data);
        }
    };
}

// ============================================================================
// Client Factory
// ============================================================================

/**
 * Creates a Socket.IO client factory for a specific namespace.
 *
 * This function is called by virtual modules to create type-safe
 * socket clients. Each call to `connect()` creates a new connection.
 *
 * @param namespace - The socket namespace path (e.g., "/notifications")
 * @returns Factory object with connect() method
 *
 * @example
 * // This is typically used through virtual modules:
 * import socket from "@agape/public/socket";
 *
 * const connection = socket.connect();
 *
 * connection.on("event", (data) => {
 *     console.log(data);
 * });
 *
 * // Cleanup when done
 * connection.disconnect();
 */
export default function createSocketClient(namespace: string): SocketClientFactory {
    return {
        connect: (): Omit<ConnectedSocket<any>, "connect"> => {
            // Build the full URL for the namespace
            const url = namespace === "/" ? BASE_URL : `${BASE_URL}${namespace}`;

            // Create Socket.IO connection
            const socket = io(url, {
                transports: ["websocket"],
                withCredentials: process.env.NODE_ENV === "development",
            });

            // Track wrapped handlers for proper cleanup
            // WeakMap allows garbage collection when handlers are no longer referenced
            const handlerMap = new WeakMap<
                (data: unknown) => void,
                (data: unknown) => void
            >();

            // Build the connected socket interface
            const connectedSocket: Omit<ConnectedSocket<any>, "connect"> = {
                /**
                 * Disconnects from the server and cleans up resources.
                 */
                disconnect: () => {
                    socket.disconnect();
                },

                /**
                 * Subscribes to an event with automatic msgpack decoding.
                 * Returns an unsubscribe function for easy cleanup.
                 */
                on: (event: string, handler: (data: unknown) => void) => {
                    const wrappedHandler = wrapEventHandler(handler);
                    handlerMap.set(handler, wrappedHandler);
                    socket.on(event, wrappedHandler);

                    // Return cleanup function
                    return () => {
                        connectedSocket.off(event, handler);
                    };
                },

                /**
                 * Unsubscribes from an event.
                 * Uses the handler map to find the correct wrapped handler.
                 */
                off: (event: string, handler?: (data: unknown) => void) => {
                    if (handler) {
                        const wrappedHandler = handlerMap.get(handler);
                        if (wrappedHandler) {
                            socket.off(event, wrappedHandler);
                            handlerMap.delete(handler);
                        }
                    } else {
                        socket.off(event);
                    }
                },

                /**
                 * Emits an event to the server.
                 */
                emit: (event: string, ...args: unknown[]) => {
                    socket.emit(event, ...args);
                },
            };

            return connectedSocket;
        },
    };
}