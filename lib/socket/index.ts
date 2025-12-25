/**
 * Socket.IO Server Handler
 *
 * Creates and configures the Socket.IO server, automatically registering
 * namespaces from socket module files in svc/. Supports Redis adapter for
 * horizontal scaling across multiple server instances.
 * 
 * Authentication:
 * - Namespaces under /public/* are public (no authentication required)
 * - All other namespaces require valid JWT cookie authentication
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Server as HttpServer } from "node:http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { cwd, findServices, toPublicUrl } from "../rpc/path";
import { Server, type Namespace } from "socket.io";
import { NamespaceManager } from "./namespace"
import logger from "#lib/log/logger";
import Jwt from "#lib/access/Jwt";
import { getCookie } from "#lib/access/middleware";

// ============================================================================
// Types
// ============================================================================

/** Socket server options */
interface SocketServerOptions {
    /** Redis URL for pub/sub adapter (enables horizontal scaling) */
    redisUrl?: string;
    /** JWT secret for authenticating non-public namespaces */
    jwtSecret?: string;
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
 * @param options - Socket server options including optional redisUrl and jwtSecret
 * @returns The configured Socket.IO server instance
 */
export default async function createSocketServer(
    httpServer: HttpServer,
    options: SocketServerOptions = {}
): Promise<Server> {
    const { redisUrl, jwtSecret, ...socketOptions } = options;

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

    // Create JWT instance if secret provided (for authenticated namespaces)
    const jwt = jwtSecret ? new Jwt(jwtSecret) : null;

    // Register all socket namespaces
    await registerSocketNamespaces(io, jwt);

    return io;
}

/**
 * Registers all socket namespaces from socket module files.
 * 
 * Authentication middleware is applied to namespaces NOT under /public.
 * Public namespaces allow unauthenticated connections.
 * 
 * @param io - Socket.IO server instance
 * @param jwt - JWT instance for authentication (null = all public)
 */
async function registerSocketNamespaces(io: Server, jwt: Jwt | null): Promise<void> {
    logger.scope("Socket").info("Registering socket namespaces");

    for await (const relativePath of findServices()) {
        const absolutePath = path.join(cwd, relativePath);
        const moduleUrl = pathToFileURL(absolutePath).href;
        const publicUrl = toPublicUrl(relativePath);

        const module = await import(moduleUrl);


        for (const [exportName, exportValue] of Object.entries(module)) {
            if (exportValue instanceof NamespaceManager) {
                const endpoint = getEndpointPath(publicUrl, exportName);
                const isPublic = endpoint.startsWith("/public");

                logger.scope("Socket").info(
                    `Registering socket namespace: ${endpoint} (${isPublic ? "public" : "authenticated"})`
                );

                const nsp = io.of(endpoint);

                // Apply authentication middleware for non-public namespaces
                if (!isPublic && jwt) {
                    nsp.use(async (socket, next) => {
                        try {
                            const cookieHeader = socket.handshake.headers.cookie;
                            const token = getCookie(cookieHeader);

                            if (!token) {
                                return next(new Error("Authentication required"));
                            }

                            const payload = await jwt.verifyToken(token);

                            // Attach user data to socket for later use
                            socket.data.user = payload;
                            next();
                        } catch (error) {
                            logger.scope("Socket").warn(`Auth failed for ${endpoint}: ${error}`);
                            next(new Error("Authentication failed"));
                        }
                    });
                }

                exportValue.connect(nsp);
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
