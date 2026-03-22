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
 */

import type { Server as HttpServer } from "node:http";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";
import {
  configureSocketContext,
} from "@mapineda48/agape-rpc/server/socket/namespace";
import {
  discoverSocketNamespaces,
} from "@mapineda48/agape-rpc/server/socket/discover";
import type { ServiceDiscovery } from "@mapineda48/agape-rpc/server/discovery";
import logger from "../log/logger.js";
import Jwt from "../security/Jwt.js";
import getCookie from "../security/getCookie.js";
import {
  checkNamespaceAccess,
  initSocketPermissions,
  type SocketUserPayload,
} from "./rbac/index.js";
import {
  attachUserToSocket,
  getContextFromSocket,
} from "./context.js";
import { runContext } from "#lib/context";

// ============================================================================
// Types
// ============================================================================

/** Socket server options */
interface SocketServerOptions {
  /** Redis URL for pub/sub adapter (enables horizontal scaling) */
  redisUrl?: string;
  /** JWT secret for authenticating non-public namespaces */
  jwtSecret?: string;
  /** Service discovery from the RPC engine */
  discovery: ServiceDiscovery;
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
 */
export default async function createSocketServer(
  httpServer: HttpServer,
  options: SocketServerOptions,
): Promise<Server> {
  const { redisUrl, jwtSecret, discovery, ...socketOptions } = options;

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

  // Configure socket context for the NamespaceManager
  // Cast runContext to match the generic unknown type expected by the RPC package
  configureSocketContext(
    runContext as <T>(ctx: unknown, cb: () => T | Promise<T>) => T | Promise<T>,
    getContextFromSocket,
  );

  // Create JWT instance if secret provided (for authenticated namespaces)
  const jwt = jwtSecret ? new Jwt(jwtSecret) : null;

  // Initialize socket permission system
  await initSocketPermissions();

  // Register all socket namespaces
  await registerSocketNamespaces(io, jwt, discovery);

  return io;
}

/**
 * Registers all socket namespaces from socket module files.
 */
async function registerSocketNamespaces(
  io: Server,
  jwt: Jwt | null,
  discovery: ServiceDiscovery,
): Promise<void> {
  logger.scope("Socket").info("Registering socket namespaces");

  const namespaces = await discoverSocketNamespaces(discovery);

  for (const { endpoint, manager } of namespaces) {
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

    manager.connect(nsp);
  }
}
