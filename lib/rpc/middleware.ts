/**
 * RPC Middleware Module
 *
 * Express middleware that handles RPC requests by matching endpoints
 * against a pre-registered map of service functions.
 *
 * This module exports:
 * - `createRpcMiddleware`: Factory function for creating the middleware (testable)
 * - `createModuleMap`: Helper to build the endpoint map from service discovery
 * - Default export: Pre-configured middleware instance for production use
 */

import type { Request, Response, NextFunction } from "express";
import { encode } from "#shared/msgpackr";
import { runContext, type IContext } from "#lib/context";
import parseError from "./error";
import { decodeArgs } from "./args";
import { CONTENT_TYPES } from "#shared/rpc";
import { HTTP_STATUS } from "./constants";
import { isForbiddenError, isUnauthorizedError } from "./types";

// ============================================================================
// Types for Auth Payload
// ============================================================================

/**
 * Auth payload passed from security middleware via res.locals
 */
interface AuthPayload {
  id: number;
  tenant: string;
  permissions: string[];
}

// ============================================================================
// Types
// ============================================================================

/** A function exported from a service module */
export type ServiceFunction = (
  ...args: unknown[]
) => Promise<unknown> | unknown;

/** Map of export names to their functions */
export type ServiceExports = Record<string, unknown>;

/** Map of endpoint paths to their handler functions */
export type ModuleMap = Map<string, ServiceFunction>;

/** Express middleware function signature */
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

/**
 * Permission validator function type.
 * Validates if the current request has permission to access the endpoint.
 *
 * @param endpoint - The RPC endpoint path
 * @throws Should throw an error if permission is denied
 */
export type PermissionValidator = (endpoint: string) => Promise<void> | void;

/**
 * Options for creating the RPC middleware.
 */
export interface CreateMiddlewareOptions {
  /**
   * Map of RPC endpoints to their handler functions.
   * Key: endpoint path (e.g., "/users/getById")
   * Value: the service function to call
   */
  moduleMap: ModuleMap;

  /**
   * Permission validator function.
   * Validates if the current request has permission to access the endpoint.
   */
  permissionValidator?: PermissionValidator;
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Sends a successful RPC response.
 */
function sendSuccess(res: Response, result: unknown): void {
  const payload = encode(result);
  res.set("Content-Type", CONTENT_TYPES.MSGPACK);
  res.status(HTTP_STATUS.OK).send(payload);
}

/**
 * Sends an error RPC response.
 */
function sendError(res: Response, error: unknown): void {
  const normalizedError = parseError(error);
  const payload = encode(normalizedError);

  let status: number = HTTP_STATUS.BAD_REQUEST;

  if (isUnauthorizedError(normalizedError)) {
    status = HTTP_STATUS.UNAUTHORIZED;
  } else if (isForbiddenError(normalizedError)) {
    status = HTTP_STATUS.FORBIDDEN;
  }

  res.set("Content-Type", CONTENT_TYPES.MSGPACK);
  res.status(status).send(payload);
}

/**
 * Checks if the request accepts MessagePack responses.
 */
function acceptsMsgpack(req: Request): boolean {
  return req.headers.accept === CONTENT_TYPES.MSGPACK;
}

/**
 * Checks if the request is a multipart request.
 */
function isMultipart(req: Request): boolean {
  return (
    req.headers["content-type"]?.startsWith(CONTENT_TYPES.MULTIPART) || false
  );
}

// ============================================================================
// RPC Middleware Factory
// ============================================================================

/**
 * Creates an RPC middleware with the provided configuration.
 *
 * This factory function enables:
 * - **Dependency Injection**: Pass custom moduleMap and permission validator
 * - **Unit Testing**: Mock dependencies for isolated testing
 * - **Flexibility**: Different configurations for different environments
 *
 * @param options - Configuration options for the middleware
 * @returns Express middleware function
 */
export function createRpcMiddleware(
  options: CreateMiddlewareOptions,
): Middleware {
  const { moduleMap, permissionValidator } = options;

  const rpcMiddleware: Middleware = async (req, res, next) => {
    // Only handle requests that explicitly accept msgpack and are multipart
    if (!acceptsMsgpack(req) || !isMultipart(req)) {
      next();
      return;
    }

    // Look up the endpoint in our registry
    const endpoint = req.path;
    const handler = moduleMap.get(endpoint);

    // If no handler found, pass to next middleware
    if (!handler) {
      next();
      return;
    }

    // Execute the RPC handler within the user context
    const authPayload = res.locals.authPayload as AuthPayload | undefined;

    // Create context from auth payload (or use default for public endpoints)
    const context: IContext = authPayload
      ? {
          id: authPayload.id,
          tenant: authPayload.tenant,
          permissions: authPayload.permissions,
          session: new Map(),
        }
      : {
          id: 0,
          tenant: "",
          permissions: [],
          session: new Map(),
        };

    // Run handler within the async context
    await runContext(context, async () => {
      try {
        // Validate permissions before executing handler
        if (permissionValidator) {
          await permissionValidator(endpoint);
        }

        const args = await decodeArgs(req);
        const result = await handler.call(null, ...args);
        sendSuccess(res, result);
      } catch (error) {
        sendError(res, error);
      }
    });
  };

  return rpcMiddleware;
}

// ============================================================================
// Module Map Builder
// ============================================================================

import path from "node:path";
import { pathToFileURL } from "node:url";
import { cwd, findServices, toPublicUrl, getEndpointPath } from "./path";

/**
 * Checks if a module export is a valid service function.
 */
function isServiceFunction(value: unknown): value is ServiceFunction {
  return typeof value === "function";
}

/**
 * Creates a module map by discovering and loading all service modules.
 *
 * This function:
 * 1. Scans the service directory for TypeScript/JavaScript files
 * 2. Imports each module dynamically
 * 3. Registers all exported functions as RPC endpoints
 *
 * @returns Promise resolving to the populated module map
 */
export async function createModuleMap(): Promise<ModuleMap> {
  const rpcEndpoints: ModuleMap = new Map();

  for await (const relativePath of findServices()) {
    const absolutePath = path.join(cwd, relativePath);
    const moduleUrl = pathToFileURL(absolutePath).href;
    const publicUrl = toPublicUrl(relativePath);

    const module = (await import(moduleUrl)) as ServiceExports;

    for (const [exportName, exportValue] of Object.entries(module)) {
      if (!isServiceFunction(exportValue)) {
        continue;
      }

      const endpoint = getEndpointPath(publicUrl, exportName);

      rpcEndpoints.set(endpoint, exportValue);
    }
  }

  return rpcEndpoints;
}

// ============================================================================
// Default Production Instance
// ============================================================================

import { validateEndpointPermission } from "./rbac/authorization";

/**
 * Pre-configured RPC middleware for production use.
 *
 * This instance is created with:
 * - Auto-discovered service modules from the `svc` directory
 *
 * For unit testing or custom configurations, use `createRpcMiddleware` directly.
 */
const moduleMap = await createModuleMap();

const rpcMiddleware = createRpcMiddleware({
  moduleMap,
  permissionValidator: validateEndpointPermission,
});

export default rpcMiddleware;
