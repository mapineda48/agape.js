/**
 * Socket.IO Client Factory
 *
 * Creates type-safe Socket.IO clients for real-time communication.
 * This module is used by virtual modules generated from socket.ts files.
 */

import { io } from "socket.io-client";
import { decode } from "@utils/msgpack";
import type { ConnectedSocket } from "@utils/socket";

// ============================================================================
// Constants
// ============================================================================

// Determines the base URL depending on the environment
const baseURL =
    process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : location.origin;

// ============================================================================
// Types
// ============================================================================


/** Socket client factory interface */
export interface SocketClientFactory {
    connect: () => ConnectedSocket<any>;
}


/**
 * Creates a wrapped event handler that decodes msgpack data.
 */
function wrapEventHandler(handler: (data: unknown) => void): any {
    return (data: unknown) => {
        if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
            handler(decode(data as Uint8Array));
        } else {
            handler(data);
        }
    };
}

/**
 * Creates a Socket.IO client factory for a specific namespace.
 *
 * @param namespace - The socket namespace (e.g., "/notifications")
 * @returns Socket client factory
 */
export default function createSocketClient(namespace: string): any {
    console.log(`Creating socket client for namespace: ${namespace}`);
    return {
        connect: (): Omit<ConnectedSocket<any>, "connect"> => {
            const url = namespace === "/" ? baseURL : `${baseURL}${namespace}`;

            const socket = io(url, {
                transports: ["websocket"],
                withCredentials: process.env.NODE_ENV === "development",
            });

            // Store wrapped handlers for proper cleanup
            const handlerMap = new WeakMap<(data: unknown) => void, (data: unknown) => void>();

            // Create the connected socket object
            const connectedSocket: Omit<ConnectedSocket<any>, "connect"> = {
                disconnect: () => {
                    socket.disconnect();
                },

                on: (event: string, handler: (data: unknown) => void) => {
                    const wrappedHandler = wrapEventHandler(handler);
                    handlerMap.set(handler, wrappedHandler);
                    socket.on(event, wrappedHandler);

                    return () => {
                        connectedSocket.off(event, handler);
                    };
                },

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

                emit: (event: string, ...args: unknown[]) => {
                    socket.emit(event, ...args);
                },
            }

            return connectedSocket;
        },
    };
}