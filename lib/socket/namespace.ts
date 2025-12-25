import mitt, { type Emitter } from "mitt";
import type { ConnectedSocket, EventMap } from "../utils/socket";
import type { Server, Namespace, Socket } from "socket.io";
import { encode, decode } from "../utils/msgpack";

const emitter = mitt();

export class NamespaceManager {
    private internalEvents: Map<string, symbol>;
    private nsp?: Namespace;

    constructor() {
        this.internalEvents = new Map<string, symbol>();
    }

    connect(nsp: Namespace) {
        if (!nsp) {
            throw new Error("Namespace not provided");
        }

        if (this.nsp) {
            throw new Error("Namespace already connected");
        }

        this.nsp = nsp;

        // Handle new client connections
        this.nsp.on("connection", (socket) => {
            // Use onAny to capture all events from this socket
            socket.onAny((event: string, argsBuffer: unknown) => {
                const internalEvent = this.getOrRegisterInternalEvent(event);
                if (argsBuffer instanceof Uint8Array || argsBuffer instanceof ArrayBuffer) {
                    const args = decode(argsBuffer as Uint8Array) as unknown[];
                    emitter.emit(internalEvent, args);
                } else {
                    emitter.emit(internalEvent, argsBuffer);
                }
            });
        });
    }

    private getOrRegisterInternalEvent(event: string) {
        let internalEvent = this.internalEvents.get(event);

        if (!internalEvent) {
            internalEvent = Symbol(event);
            this.internalEvents.set(event, internalEvent);
        }

        return internalEvent;
    }

    on(event: string, handler: any) {
        const internalEvent = this.getOrRegisterInternalEvent(event);

        emitter.on(internalEvent, handler);
    }

    off(event: string, handler?: any) {
        const internalEvent = this.getOrRegisterInternalEvent(event);

        emitter.off(internalEvent, handler);
    }

    emit(event: string, ...args: any[]) {
        this.nsp?.emit(event, encode(args));
    }
}

export function registerNamespace<Events extends EventMap>(): ConnectedSocket<Events> {
    const proxy: any = new NamespaceManager();

    return proxy;
}