/**
 * Socket.IO Client Factory
 *
 * Creates type-safe Socket.IO clients for real-time communication.
 */

import { io } from "socket.io-client";
import { decode } from "../msgpackr.ts";
import type { ConnectedSocket, EventMap } from "../socket.ts";

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : location.origin;

// ============================================================================
// Types
// ============================================================================

export interface SocketClientFactory<Events extends EventMap = EventMap> {
  connect: () => Omit<ConnectedSocket<Events>, "connect">;
}

// ============================================================================
// Internal Utilities
// ============================================================================

function wrapEventHandler(
  handler: (data: unknown) => void,
): (data: unknown) => void {
  return (data: unknown) => {
    if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
      const decoded = decode(data as Uint8Array);
      handler(Array.isArray(decoded) ? decoded[0] : decoded);
    } else {
      handler(data);
    }
  };
}

// ============================================================================
// Client Factory
// ============================================================================

export default function createSocketClient<Events extends EventMap = EventMap>(
  namespace: string,
): SocketClientFactory<Events> {
  return {
    connect: (): Omit<ConnectedSocket<Events>, "connect"> => {
      const url = namespace === "/" ? BASE_URL : `${BASE_URL}${namespace}`;

      console.log(url);

      const socket = io(url, {
        transports: ["websocket"],
        withCredentials: process.env.NODE_ENV === "development",
      });

      const handlerMap = new WeakMap<
        (data: unknown) => void,
        (data: unknown) => void
      >();

      const connectedSocket: Omit<ConnectedSocket<Events>, "connect"> = {
        disconnect: () => {
          socket.disconnect();
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        on: (event: string, handler: (data: any) => void) => {
          const wrappedHandler = wrapEventHandler(handler);
          handlerMap.set(handler, wrappedHandler);
          socket.on(event, wrappedHandler);

          return () => {
            socket.off(event, handlerMap.get(handler));
            handlerMap.delete(handler);
          };
        },

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        off: (event: string, handler?: (data: any) => void) => {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emit: (event: string, ...args: any[]) => {
          console.log(event, ...args);
          socket.emit(event, ...args);
        },
      };

      return connectedSocket;
    },
  };
}
