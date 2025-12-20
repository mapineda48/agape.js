/**
 * Socket.IO RPC Module Types
 *
 * Type definitions for the Socket.IO RPC layer, providing type safety
 * between server and client.
 */

// ============================================================================
// Core Contract Types
// ============================================================================

/**
 * Map of event names to their handler signatures.
 * Events flow from server to client.
 */
export type EventMap = Record<string, (...args: any[]) => void>;

/**
 * Map of method names to their handler signatures.
 * Methods are RPC calls from client to server that return a Promise.
 */
export type MethodMap = Record<string, (...args: any[]) => Promise<any>>;

/**
 * A Socket.IO RPC contract defining the namespace, events, and methods.
 */
export interface SocketContract<
    TEvents extends EventMap = EventMap,
    TMethods extends MethodMap = MethodMap,
> {
    /** The namespace path (e.g., "/notifications") */
    namespace: string;
    /** Server-to-client events */
    events: TEvents;
    /** Client-to-server RPC methods */
    methods: TMethods;
}

// ============================================================================
// Client Types
// ============================================================================

/**
 * Event subscription function.
 */
export type OnFunction<TEvents extends EventMap> = <K extends keyof TEvents>(
    event: K,
    handler: TEvents[K]
) => void;

/**
 * Event unsubscription function.
 */
export type OffFunction<TEvents extends EventMap> = <K extends keyof TEvents>(
    event: K,
    handler?: TEvents[K]
) => void;

/**
 * The connected socket client interface.
 * Contains disconnect, event handlers, and typed RPC methods.
 */
export type ConnectedSocket<
    TEvents extends EventMap,
    TMethods extends MethodMap,
> = {
    /** Disconnect from the socket */
    disconnect: () => void;
    /** Subscribe to server events */
    on: OnFunction<TEvents>;
    /** Unsubscribe from server events */
    off: OffFunction<TEvents>;
} & TMethods;

/**
 * Socket client factory returned by the virtual module.
 */
export interface SocketClient<
    TEvents extends EventMap = EventMap,
    TMethods extends MethodMap = MethodMap,
> {
    /** Connect to the socket namespace. Returns connection and disconnect function. */
    connect: () => ConnectedSocket<TEvents, TMethods>;
}

// ============================================================================
// Server Types
// ============================================================================

/**
 * A module export that defines a socket contract.
 */
export interface SocketModuleExport {
    /** Events the server can emit to clients */
    events?: EventMap;
    /** Methods clients can call on the server */
    methods?: MethodMap;
}

/**
 * Validates if a module export is a socket contract.
 */
export function isSocketContract(value: unknown): value is SocketModuleExport {
    return (
        value !== null &&
        typeof value === "object" &&
        ("events" in value || "methods" in value)
    );
}
