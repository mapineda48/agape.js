/**
 * Socket.IO Server Handler
 *
 * Creates and configures the Socket.IO server, automatically registering
 * namespaces from socket module files in svc/. Supports Redis adapter for
 * horizontal scaling across multiple server instances.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Server as HttpServer } from "node:http";
import { Server, Namespace, Socket } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { encode, decode } from "#utils/msgpack";
import { cwd, sockets, toNamespace } from "./path";
import { RPC_METHOD_PREFIX, RPC_RESPONSE_SUFFIX, RPC_ERROR_SUFFIX } from "./constants";
import { isSocketContract, type SocketModuleExport } from "./types";

// ============================================================================
// Types
// ============================================================================

/** A function exported from a socket module */
type SocketMethod = (...args: unknown[]) => Promise<unknown> | unknown;

/** Map of export names to their functions */
type ModuleExports = Record<string, unknown>;

/** Registered namespace info */
interface NamespaceInfo {
    namespace: string;
    events: string[];
    methods: string[];
}

/** Socket server options */
interface SocketServerOptions {
    /** Redis URL for pub/sub adapter (enables horizontal scaling) */
    redisUrl?: string;
    /** Additional Socket.IO server options */
    [key: string]: unknown;
}

// ============================================================================
// Socket Server Factory
// ============================================================================

/** Global Socket.IO server instance (set after initialization) */
let ioInstance: Server | null = null;

/**
 * Gets the Socket.IO server instance.
 * Must be called after createSocketServer has completed.
 * 
 * @returns The Socket.IO server instance
 * @throws Error if called before server is initialized
 */
export function getSocketServer(): Server {
    if (!ioInstance) {
        throw new Error("Socket.IO server not initialized. Call createSocketServer first.");
    }
    return ioInstance;
}

/**
 * Creates and configures the Socket.IO server.
 *
 * @param httpServer - The HTTP server to attach Socket.IO to
 * @param options - Socket server options including optional redisUrl
 * @returns The configured Socket.IO server instance
 */
export async function createSocketServer(
    httpServer: HttpServer,
    options: SocketServerOptions = {}
): Promise<Server> {
    const { redisUrl, ...socketOptions } = options;

    const io = new Server(httpServer, {
        transports: ["websocket"],
        ...socketOptions as object,
    });

    // Configure Redis adapter if URL provided
    if (redisUrl) {
        const pubClient = createClient({ url: redisUrl });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);

        io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO Redis adapter connected");
    }

    // Store global reference
    ioInstance = io;

    // Register all socket namespaces
    await registerSocketNamespaces(io);

    return io;
}

/**
 * Registers all socket namespaces from socket module files.
 */
async function registerSocketNamespaces(io: Server): Promise<NamespaceInfo[]> {
    const namespaces: NamespaceInfo[] = [];

    for await (const relativePath of sockets) {
        const absolutePath = path.join(cwd, relativePath);
        const moduleUrl = pathToFileURL(absolutePath).href;
        const namespace = toNamespace(relativePath);

        const module = (await import(moduleUrl)) as ModuleExports;
        const info = registerNamespace(io, namespace, module);
        namespaces.push(info);
    }

    return namespaces;
}

/**
 * Registers a single namespace with its events and methods.
 */
function registerNamespace(
    io: Server,
    namespacePath: string,
    module: ModuleExports
): NamespaceInfo {
    const nsp = io.of(namespacePath);
    const events: string[] = [];
    const methods: string[] = [];

    // Extract events object (if present)
    if (module.events && typeof module.events === "object") {
        events.push(...Object.keys(module.events));
    }

    // Register RPC methods
    for (const [exportName, exportValue] of Object.entries(module)) {
        if (exportName === "events" || exportName === "default") {
            continue;
        }

        if (typeof exportValue === "function") {
            methods.push(exportName);
        }
    }

    // Set up connection handler
    nsp.on("connection", (socket: Socket) => {
        console.log("Client connected to namespace:", namespacePath);
        registerSocketMethods(socket, module, methods);
    });

    return {
        namespace: namespacePath,
        events,
        methods,
    };
}

/**
 * Registers RPC method handlers on a socket.
 */
function registerSocketMethods(
    socket: Socket,
    module: ModuleExports,
    methods: string[]
): void {
    for (const methodName of methods) {
        const method = module[methodName] as SocketMethod;
        const eventName = `${RPC_METHOD_PREFIX}${methodName}`;

        socket.on(eventName, async (requestId: string, argsBuffer: Uint8Array) => {
            try {
                // Decode msgpack arguments
                const args = decode(argsBuffer) as unknown[];

                // Call the method
                const result = await method.call(null, ...args);

                // Send success response
                const responseEvent = `${eventName}${RPC_RESPONSE_SUFFIX}`;
                socket.emit(responseEvent, requestId, encode(result));
            } catch (error) {
                console.error("Socket RPC error:", eventName, error);
                // Send error response
                const errorEvent = `${eventName}${RPC_ERROR_SUFFIX}`;
                const errorPayload = error instanceof Error
                    ? { message: error.message, name: error.name }
                    : { message: String(error) };
                socket.emit(errorEvent, requestId, encode(errorPayload));
            }
        });
    }
}

/**
 * Utility to emit an event to all clients in a namespace.
 *
 * @param io - The Socket.IO server instance
 * @param namespace - The namespace to emit to
 * @param event - The event name
 * @param data - The data to send
 */
export function emitToNamespace(
    io: Server,
    namespace: string,
    event: string,
    data: unknown
): void {
    io.of(namespace).emit(event, encode(data));
}

/**
 * Utility to emit an event to a specific socket.
 *
 * @param socket - The socket to emit to
 * @param event - The event name
 * @param data - The data to send
 */
export function emitToSocket(
    socket: Socket,
    event: string,
    data: unknown
): void {
    socket.emit(event, encode(data));
}

export default createSocketServer;
