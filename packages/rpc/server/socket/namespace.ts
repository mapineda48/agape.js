/**
 * Socket Namespace Manager
 *
 * Provides a type-safe abstraction for Socket.IO namespaces on the server.
 * Each NamespaceManager instance handles a single namespace and uses
 * internal symbols to scope events, preventing conflicts between namespaces.
 *
 * The manager uses msgpack for efficient binary serialization of event data.
 */

import EventEmitter from "node:events";
import type { Namespace, Socket } from "socket.io";
import { encode, decode } from "../../msgpackr.ts";
import type { ConnectedSocket, EventMap } from "../../socket.ts";

// ============================================================================
// Types
// ============================================================================

/** Internal event emitter for cross-socket communication */
const emitter = new EventEmitter();

/**
 * Context runner function type - injected by the server.
 */
export type SocketContextRunner = <T>(
  context: unknown,
  callback: () => T | Promise<T>,
) => T | Promise<T>;

/**
 * Context extractor function type - gets context from a socket instance.
 */
export type SocketContextExtractor = (socket: Socket) => unknown | null;

/**
 * Event handler context passed to event callbacks.
 */
export interface EventHandlerContext {
  /** The socket that triggered the event */
  socket: Socket;
  /** User context (id, tenant, permissions) */
  context: unknown | null;
}

/**
 * Extended event handler that receives context.
 */
export type ContextAwareHandler<T = unknown> = (
  data: T,
  ctx: EventHandlerContext,
) => void | Promise<void>;

// ============================================================================
// Module-level configuration
// ============================================================================

let _runSocketContext: SocketContextRunner | null = null;
let _getContextFromSocket: SocketContextExtractor | null = null;

/**
 * Configure the socket context functions. Must be called before any namespace connects.
 */
export function configureSocketContext(
  runContext: SocketContextRunner,
  getContext: SocketContextExtractor,
): void {
  _runSocketContext = runContext;
  _getContextFromSocket = getContext;
}

// ============================================================================
// Namespace Manager
// ============================================================================

/**
 * Manages a Socket.IO namespace with type-safe event handling.
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
   */
  connect(nsp: Namespace): void {
    if (!nsp) {
      throw new Error("Namespace not provided");
    }

    if (this.nsp) {
      throw new Error("Namespace already connected");
    }

    this.nsp = nsp;

    this.nsp.on("connection", (socket) => {
      const context = _getContextFromSocket?.(socket) ?? null;

      const connectEvent = this.getOrRegisterInternalEvent("socket:connect");
      this.emitInternalWithContext(connectEvent, {}, socket, context);

      socket.on("disconnect", () => {
        const disconnectEvent =
          this.getOrRegisterInternalEvent("socket:disconnect");
        this.emitInternalWithContext(disconnectEvent, {}, socket, context);
      });

      socket.onAny((event: string, data: unknown) => {
        const internalEvent = this.getOrRegisterInternalEvent(event);

        let decodedData: unknown;
        if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
          const decoded = decode(data as Uint8Array);
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
    context: unknown | null,
  ): void {
    const handlerContext: EventHandlerContext = { socket, context };

    if (context && _runSocketContext) {
      _runSocketContext(context, () => {
        emitter.emit(event, data, handlerContext);
      });
    } else {
      emitter.emit(event, data, handlerContext);
    }
  }

  /**
   * Gets or creates an internal symbol for the given event name.
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
   */
  on(event: string, handler: ContextAwareHandler): void {
    const internalEvent = this.getOrRegisterInternalEvent(event);
    emitter.on(internalEvent, handler);
  }

  /**
   * Unsubscribes from an event.
   */
  off(event: string, handler: ContextAwareHandler): void {
    const internalEvent = this.getOrRegisterInternalEvent(event);
    emitter.off(internalEvent, handler);
  }

  /**
   * Emits an event to all connected clients in this namespace.
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
 */
export function registerNamespace<
  Events extends EventMap,
>(): ConnectedSocket<Events> {
  return new NamespaceManager() as unknown as ConnectedSocket<Events>;
}
