/**
 * RPC Server Facade
 *
 * High-level function that receives the absolute path to the services
 * folder and initializes the entire RPC system.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServiceDiscovery, type ServiceDiscovery } from "./discovery.ts";
import {
  createRpcMiddleware,
  type ModuleMap,
  type ServiceFunction,
  type ServiceExports,
  type PermissionValidator,
  type ContextFactory,
  type ContextRunner,
} from "./middleware.ts";
import { setErrorLogger, type RpcLogger } from "./error.ts";
import type { Request, Response, NextFunction } from "express";

// ============================================================================
// Types
// ============================================================================

export interface RpcServerOptions {
  /** Creates a context from auth payload */
  createContext: ContextFactory;

  /** Runs a callback within the context */
  runContext: ContextRunner;

  /** Permission validator function (optional) */
  permissionValidator?: PermissionValidator;

  /** Logger for error handling (optional, defaults to console) */
  logger?: RpcLogger;
}

export interface RpcEngine {
  /** Express middleware ready to use with app.use() */
  middleware: (req: Request, res: Response, next: NextFunction) => void;

  /** The discovered module map (endpoints → handlers) */
  moduleMap: ModuleMap;

  /** Service discovery utilities */
  discovery: ServiceDiscovery;
}

// ============================================================================
// Module Map Builder
// ============================================================================

function isServiceFunction(value: unknown): value is ServiceFunction {
  return typeof value === "function";
}

/**
 * Creates a module map by discovering and loading all service modules.
 */
async function buildModuleMap(discovery: ServiceDiscovery): Promise<ModuleMap> {
  const rpcEndpoints: ModuleMap = new Map();

  for await (const relativePath of discovery.findServices()) {
    const absolutePath = path.join(discovery.servicesDir, relativePath);
    const moduleUrl = pathToFileURL(absolutePath).href;
    const publicUrl = discovery.toPublicUrl(relativePath);

    const module = (await import(moduleUrl)) as ServiceExports;

    for (const [exportName, exportValue] of Object.entries(module)) {
      if (!isServiceFunction(exportValue)) {
        continue;
      }

      const endpoint = discovery.getEndpointPath(publicUrl, exportName);
      rpcEndpoints.set(endpoint, exportValue);
    }
  }

  return rpcEndpoints;
}

// ============================================================================
// Facade
// ============================================================================

/**
 * Initializes the RPC system.
 *
 * @param servicesDir - Absolute path to the services directory
 * @param options - Configuration options (context, permissions, logger)
 * @returns RPC engine with middleware, module map, and discovery utilities
 *
 * @example
 * ```ts
 * const rpc = await initRpc(path.resolve(__dirname, "../services"), {
 *   runContext,
 *   createContext: (auth) => ({
 *     id: auth?.id ?? 0,
 *     tenant: auth?.tenant ?? "",
 *     permissions: auth?.permissions ?? [],
 *     session: new Map(),
 *     source: "http",
 *   }),
 *   permissionValidator: validateEndpointPermission,
 * });
 *
 * app.use(rpc.middleware);
 * ```
 */
export async function initRpc(
  servicesDir: string,
  options: RpcServerOptions,
): Promise<RpcEngine> {
  const { createContext, runContext, permissionValidator, logger } = options;

  // Configure logger if provided
  if (logger) {
    setErrorLogger(logger);
  }

  // Create service discovery
  const discovery = createServiceDiscovery(servicesDir);

  // Build module map
  const moduleMap = await buildModuleMap(discovery);

  // Create middleware
  const middleware = createRpcMiddleware({
    moduleMap,
    createContext,
    runContext,
    permissionValidator,
  });

  return {
    middleware,
    moduleMap,
    discovery,
  };
}

// Re-exports
export { createServiceDiscovery, type ServiceDiscovery } from "./discovery.ts";
export { createRpcMiddleware, type ModuleMap, type ServiceFunction, type PermissionValidator, type AuthPayload } from "./middleware.ts";
export { withValidation, getSchema } from "./validation.ts";
export { setErrorLogger, type RpcLogger } from "./error.ts";
export { NamespaceManager, registerNamespace, configureSocketContext } from "./socket/namespace.ts";
export { discoverSocketNamespaces, type DiscoveredNamespace } from "./socket/discover.ts";
