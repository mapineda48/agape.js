/**
 * Socket.IO Client Factory
 *
 * Creates type-safe Socket.IO clients for real-time communication.
 * This module is used by virtual modules generated from *.socket.ts files.
 */

import { io, Socket } from "socket.io-client";
import { encode, decode } from "@utils/msgpack";

// ============================================================================
// Constants
// ============================================================================

const RPC_METHOD_PREFIX = "rpc:";
const RPC_RESPONSE_SUFFIX = ":response";
const RPC_ERROR_SUFFIX = ":error";

// Determines the base URL depending on the environment
const baseURL =
    process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : location.origin;

// ============================================================================
// Types
// ============================================================================

/** RPC method function signature */
type RpcMethod = (...args: unknown[]) => Promise<unknown>;

/** Event handler function signature */
type EventHandler = (...args: unknown[]) => void;

/** Connected socket interface */
export interface ConnectedSocket {
    /** Disconnect from the socket */
    disconnect: () => void;
    /** Subscribe to server events */
    on: (event: string, handler: EventHandler) => void;
    /** Unsubscribe from server events */
    off: (event: string, handler?: EventHandler) => void;
    /** Call an RPC method by name */
    call: (method: string, ...args: unknown[]) => Promise<unknown>;
}

/** Socket client factory interface */
export interface SocketClientFactory {
    connect: () => ConnectedSocket;
}

// ============================================================================
// Implementation
// ============================================================================

/** Counter for unique request IDs */
let requestIdCounter = 0;

/**
 * Generates a unique request ID for RPC calls.
 */
function generateRequestId(): string {
    return `${Date.now()}-${++requestIdCounter}`;
}

/**
 * Creates an RPC method that communicates over the socket.
 */
function createRpcMethod(socket: Socket, methodName: string): RpcMethod {
    const eventName = `${RPC_METHOD_PREFIX}${methodName}`;
    const responseEvent = `${eventName}${RPC_RESPONSE_SUFFIX}`;
    const errorEvent = `${eventName}${RPC_ERROR_SUFFIX}`;

    return (...args: unknown[]): Promise<unknown> => {
        return new Promise((resolve, reject) => {
            const requestId = generateRequestId();

            // Response handler
            const handleResponse = (...responseArgs: unknown[]) => {
                const [respId, rawData] = responseArgs as [string, ArrayBuffer | Uint8Array];
                if (respId !== requestId) return;
                cleanup();
                // Convert ArrayBuffer to Uint8Array if needed (Socket.IO sends ArrayBuffer)
                const data = rawData instanceof ArrayBuffer ? new Uint8Array(rawData) : rawData;
                resolve(decode(data));
            };

            // Error handler
            const handleError = (...errorArgs: unknown[]) => {
                const [respId, rawData] = errorArgs as [string, ArrayBuffer | Uint8Array];
                if (respId !== requestId) return;
                cleanup();
                // Convert ArrayBuffer to Uint8Array if needed (Socket.IO sends ArrayBuffer)
                const data = rawData instanceof ArrayBuffer ? new Uint8Array(rawData) : rawData;
                const error = decode(data) as { message: string; name?: string };
                reject(new Error(error.message));
            };

            // Cleanup listeners
            const cleanup = () => {
                socket.off(responseEvent, handleResponse);
                socket.off(errorEvent, handleError);
            };

            // Register listeners
            socket.on(responseEvent, handleResponse);
            socket.on(errorEvent, handleError);

            // Send the RPC request
            socket.emit(eventName, requestId, encode(args));
        });
    };
}

/**
 * Creates a wrapped event handler that decodes msgpack data.
 */
function wrapEventHandler(handler: EventHandler): EventHandler {
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
 * @param _events - Array of event names the server can emit (for documentation)
 * @param methods - Array of RPC method names
 * @returns Socket client factory
 */
export default function createSocketClient(
    namespace: string,
    _events: string[],
    methods: string[]
): SocketClientFactory {
    // Create a map of RPC methods
    const rpcMethods = new Map<string, RpcMethod>();

    return {
        connect: (): ConnectedSocket => {
            const url = namespace === "/" ? baseURL : `${baseURL}${namespace}`;

            const socket = io(url, {
                transports: ["websocket"],
                withCredentials: process.env.NODE_ENV === "development",
            });

            // Initialize RPC methods for this socket
            for (const methodName of methods) {
                rpcMethods.set(methodName, createRpcMethod(socket, methodName));
            }

            // Store wrapped handlers for proper cleanup
            const handlerMap = new WeakMap<EventHandler, EventHandler>();

            // Create the connected socket object
            const connectedSocket: ConnectedSocket = {
                disconnect: () => {
                    socket.disconnect();
                },

                on: (event: string, handler: EventHandler) => {
                    const wrappedHandler = wrapEventHandler(handler);
                    handlerMap.set(handler, wrappedHandler);
                    socket.on(event, wrappedHandler);
                },

                off: (event: string, handler?: EventHandler) => {
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

                call: (method: string, ...args: unknown[]): Promise<unknown> => {
                    const rpcMethod = rpcMethods.get(method);
                    if (!rpcMethod) {
                        return Promise.reject(new Error(`Unknown method: ${method}`));
                    }
                    return rpcMethod(...args);
                },
            };

            // Add RPC methods as direct properties for convenience
            for (const methodName of methods) {
                (connectedSocket as unknown as Record<string, unknown>)[methodName] = rpcMethods.get(methodName);
            }

            return connectedSocket;
        },
    };
}
