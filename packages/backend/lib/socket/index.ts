/**
 * Socket.IO Server Handler
 *
 * Creates and configures the Socket.IO server, automatically registering
 * namespaces from socket module files in services/. Supports Redis adapter for
 * horizontal scaling across multiple server instances.
 *
 * Authentication & Authorization:
 * - @public namespaces: No authentication required
 * - @permission <name> namespaces: Require specific permission to connect
 * - No tag namespaces: Require any authenticated user
 *
 * The RBAC system uses JSDoc tags on namespace exports, similar to RPC endpoints.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Server as HttpServer } from "node:http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { cwd, findServices, toPublicUrl, getEndpointPath } from "../rpc/path";
import { Server } from "socket.io";
import { NamespaceManager } from "./namespace";
import logger from "../log/logger";
import Jwt from "../security/Jwt";
import getCookie from "../security/getCookie";
import {
  checkNamespaceAccess,
  initSocketPermissions,
  type SocketUserPayload,
} from "./rbac";
import { attachUserToSocket } from "./context";

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
    throw new Error(
      "Socket.IO server not initialized. Call createSocketServer first.",
    );
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
  options: SocketServerOptions = {},
): Promise<Server> {
  const { redisUrl, jwtSecret, ...socketOptions } = options;

  const io = new Server(httpServer, {
    transports: ["websocket"],
    ...(socketOptions as object),
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

  // Initialize socket permission system
  await initSocketPermissions();

  // Register all socket namespaces
  await registerSocketNamespaces(io, jwt);

  return io;
}

/**
 * Registers all socket namespaces from socket module files.
 *
 * Authentication and authorization middleware is applied based on JSDoc tags:
 * - @public: No authentication required
 * - @permission <name>: Specific permission required
 * - No tag: Any authenticated user can connect
 *
 * @param io - Socket.IO server instance
 * @param jwt - JWT instance for authentication (null = all public)
 */
async function registerSocketNamespaces(
  io: Server,
  jwt: Jwt | null,
): Promise<void> {
  logger.scope("Socket").info("Registering socket namespaces");

  for await (const relativePath of findServices()) {
    const absolutePath = path.join(cwd, relativePath);
    const moduleUrl = pathToFileURL(absolutePath).href;
    const publicUrl = toPublicUrl(relativePath);

    const module = await import(moduleUrl);

    for (const [exportName, exportValue] of Object.entries(module)) {
      if (exportValue instanceof NamespaceManager) {
        const endpoint = getEndpointPath(publicUrl, exportName);

        // Check namespace permissions
        const { isPublic, requiredPermission } =
          await checkNamespaceAccess(endpoint, null);

        const accessType = isPublic
          ? "public"
          : requiredPermission
            ? `permission: ${requiredPermission}`
            : "authenticated";

        logger
          .scope("Socket")
          .info(`Registering socket namespace: ${endpoint} (${accessType})`);

        const nsp = io.of(endpoint);

        // Apply authentication/authorization middleware
        nsp.use(async (socket, next) => {
          try {
            let user: SocketUserPayload | null = null;

            // Try to authenticate if JWT is available
            if (jwt) {
              const cookieHeader = socket.handshake.headers.cookie;
              const token = getCookie(cookieHeader);

              if (token) {
                try {
                  user = await jwt.verifyToken<SocketUserPayload>(token);
                } catch {
                  // Token invalid - user remains null
                  // For public namespaces this is fine
                  // For auth-required namespaces, will fail below
                }
              }
            }

            // Check access permissions
            const accessResult = await checkNamespaceAccess(endpoint, user);

            if (!accessResult.allowed) {
              if (accessResult.requiresAuth && !user) {
                return next(new Error("Authentication required"));
              }
              if (accessResult.requiredPermission) {
                return next(
                  new Error(
                    `Permission denied. Required: ${accessResult.requiredPermission}`,
                  ),
                );
              }
              return next(new Error("Access denied"));
            }

            // Attach user context to socket
            attachUserToSocket(socket, user);
            next();
          } catch (error) {
            logger
              .scope("Socket")
              .warn(`Auth failed for ${endpoint}: ${error}`);
            next(new Error("Authentication failed"));
          }
        });

        exportValue.connect(nsp);
        break;
      }
    }
  }
}
