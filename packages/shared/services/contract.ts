/**
 * Service Contract Utilities
 *
 * Provides helpers for declaring service contracts in shared.
 * These stubs are used by the Vite virtual module generator to
 * discover RPC endpoints and socket namespaces without importing
 * actual backend implementations.
 *
 * Convention:
 * - Exported functions → RPC endpoints
 * - socketContract() exports → Socket.IO namespaces
 */

/**
 * Well-known symbol used to mark socket namespace contracts.
 * Both shared (producer) and rpc/vite generator (consumer) use
 * the same Symbol.for() key, avoiding a direct package dependency.
 */
export const SOCKET_NAMESPACE = Symbol.for("agape-rpc:socket-namespace");

// ============================================================================
// Socket Contract Types
// ============================================================================

/**
 * Base type for event maps (mirrors rpc/socket.ts without dependency).
 */
type EventMap = Record<string, void | unknown>;

type Key<E extends EventMap> = Extract<keyof E, string>;

type EmitArgs<E extends EventMap, K extends Key<E>> = E[K] extends void
  ? []
  : [payload: E[K]];

type Handler<E extends EventMap, K extends Key<E>> = E[K] extends void
  ? () => void
  : (payload: E[K]) => void;

/**
 * Type-safe socket interface for contracts.
 * Mirrors ConnectedSocket from rpc/socket.ts without importing it.
 */
export interface SocketContractMarker<Events extends EventMap = EventMap> {
  disconnect(): void;
  on<K extends Key<Events>>(event: K, handler: Handler<Events, K>): () => void;
  off<K extends Key<Events>>(event: K, handler?: Handler<Events, K>): void;
  emit<K extends Key<Events>>(event: K, ...args: EmitArgs<Events, K>): void;
  connect(): Omit<SocketContractMarker<Events>, "connect">;
}

/**
 * Creates a socket namespace contract stub.
 *
 * At runtime this is just a marker object. The Vite generator
 * detects the SOCKET_NAMESPACE symbol and generates a
 * `createSocketClient()` call for the virtual module.
 */
export function socketContract<Events extends EventMap>(): SocketContractMarker<Events> {
  return { [SOCKET_NAMESPACE]: true } as unknown as SocketContractMarker<Events>;
}
