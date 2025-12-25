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
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { cwd, findServices, toPublicUrl } from "../rpc/path";
import { Server } from "socket.io";
import { NamespaceManager } from "./namespace"
import logger from "#lib/log/logger";

// ============================================================================
// Types
// ============================================================================

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
export default async function createSocketServer(
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
        logger.scope("Socket").info("Socket.IO Redis adapter connected");
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
async function registerSocketNamespaces(io: Server): Promise<void> {
    logger.scope("Socket").info("Registering socket namespaces");

    for await (const relativePath of findServices()) {
        const absolutePath = path.join(cwd, relativePath);
        const moduleUrl = pathToFileURL(absolutePath).href;
        const publicUrl = toPublicUrl(relativePath);

        const module = await import(moduleUrl);


        for (const [exportName, exportValue] of Object.entries(module)) {
            if (exportValue instanceof NamespaceManager) {
                const endpoint = getEndpointPath(publicUrl, exportName);

                logger.scope("Socket").info(`Registering socket namespace: ${endpoint}`);

                exportValue.connect(io.of(endpoint));
                break;
            }
        }
    }
}

/**
 * Generates the endpoint path for an exported function.
 *
 * Default exports map to the module URL root.
 * Named exports append the export name to the module URL.
 *
 * @example
 * getEndpointPath("/users", "getById") → "/users/getById"
 * getEndpointPath("/users", "default") → "/users"
 */
function getEndpointPath(moduleUrl: string, exportName: string): string {
    const suffix = exportName !== "default" ? exportName : "";
    return path.posix.join("/", moduleUrl, suffix);
}
