/**
 * RPC Middleware Module
 *
 * Express middleware that handles RPC requests by matching endpoints
 * against a pre-registered map of service functions.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Request, Response, NextFunction } from "express";
import { encode } from "#utils/msgpack";
import parseError from "./error";
import { parseArgs } from "./parseArgs";
import { cwd, svc, toPublicUrl } from "./path";
import { CONTENT_TYPES, HTTP_STATUS } from "./constants";

// ============================================================================
// Types
// ============================================================================

/** A function exported from a service module */
type ServiceFunction = (...args: unknown[]) => Promise<unknown> | unknown;

/** Map of export names to their functions */
type ServiceExports = Record<string, unknown>;

/** Express middleware function signature */
type Middleware = (req: Request, res: Response, next: NextFunction) => void;

// ============================================================================
// RPC Endpoint Registry
// ============================================================================

/**
 * Map of RPC endpoints to their handler functions.
 * Key: endpoint path (e.g., "/users/getById")
 * Value: the service function to call
 */
const rpcEndpoints = new Map<string, ServiceFunction>();

/**
 * Registers all service functions as RPC endpoints.
 */
async function registerServiceEndpoints(): Promise<void> {
  for await (const relativePath of svc) {
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

/**
 * Checks if a module export is a valid service function.
 */
function isServiceFunction(value: unknown): value is ServiceFunction {
  return typeof value === "function";
}

// Execute registration during module initialization
await registerServiceEndpoints();

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
  res.set("Content-Type", CONTENT_TYPES.MSGPACK);
  res.status(HTTP_STATUS.BAD_REQUEST).send(payload);
}

/**
 * Checks if the request accepts MessagePack responses.
 */
function acceptsMsgpack(req: Request): boolean {
  return req.headers.accept === CONTENT_TYPES.MSGPACK;
}

// ============================================================================
// RPC Middleware
// ============================================================================

/**
 * RPC middleware that handles incoming requests.
 *
 * This middleware:
 * 1. Checks if the request accepts MessagePack (via Accept header)
 * 2. Looks up the endpoint in the registered RPC endpoints map
 * 3. If found, executes the RPC handler and returns the response
 * 4. If not found, passes control to the next middleware
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
const rpcMiddleware: Middleware = async (req, res, next) => {
  // Only handle requests that explicitly accept msgpack
  if (!acceptsMsgpack(req)) {
    next();
    return;
  }

  // Look up the endpoint in our registry
  const endpoint = req.path;
  const handler = rpcEndpoints.get(endpoint);

  // If no handler found, pass to next middleware
  if (!handler) {
    next();
    return;
  }

  // Execute the RPC handler
  try {
    const args = await parseArgs(req);
    const result = await handler.call(null, ...args);
    sendSuccess(res, result);
  } catch (error) {
    sendError(res, error);
  }
};

export default rpcMiddleware;
