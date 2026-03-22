/**
 * RPC Middleware Module
 *
 * Express middleware that handles RPC requests by matching endpoints
 * against a pre-registered map of service functions.
 */

import type { Request, Response, NextFunction } from "express";
import { encode } from "../msgpackr.ts";
import parseError from "./error.ts";
import { decodeArgs } from "./args.ts";
import { getSchema } from "./validation.ts";
import { CONTENT_TYPES } from "../rpc.ts";
import { HTTP_STATUS } from "./constants.ts";
import { isForbiddenError, isUnauthorizedError } from "./types.ts";

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
 */
export type PermissionValidator = (endpoint: string) => Promise<void> | void;

/**
 * Auth payload from prior middleware (e.g., JWT).
 */
export interface AuthPayload {
  id: number;
  tenant: string;
  permissions: string[];
  [key: string]: unknown;
}

/**
 * Function to create a context object from auth payload.
 */
export type ContextFactory = (authPayload?: AuthPayload) => unknown;

/**
 * Function to run a callback within a context.
 */
export type ContextRunner = <T>(ctx: unknown, callback: () => T | Promise<T>) => T | Promise<T>;

/**
 * Options for creating the RPC middleware.
 */
export interface CreateMiddlewareOptions {
  /** Map of RPC endpoints to their handler functions */
  moduleMap: ModuleMap;

  /** Creates a context from auth payload */
  createContext: ContextFactory;

  /** Runs a callback within the context */
  runContext: ContextRunner;

  /** Permission validator function */
  permissionValidator?: PermissionValidator;
}

// ============================================================================
// Response Helpers
// ============================================================================

function sendSuccess(res: Response, result: unknown): void {
  const payload = encode(result);
  res.set("Content-Type", CONTENT_TYPES.MSGPACK);
  res.status(HTTP_STATUS.OK).send(payload);
}

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

function acceptsMsgpack(req: Request): boolean {
  return req.headers.accept === CONTENT_TYPES.MSGPACK;
}

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
 */
export function createRpcMiddleware(
  options: CreateMiddlewareOptions,
): Middleware {
  const { moduleMap, permissionValidator, createContext, runContext } = options;

  const rpcMiddleware: Middleware = async (req, res, next) => {
    if (!acceptsMsgpack(req) || !isMultipart(req)) {
      next();
      return;
    }

    const endpoint = req.path;
    const handler = moduleMap.get(endpoint);

    if (!handler) {
      next();
      return;
    }

    const authPayload = res.locals.authPayload as AuthPayload | undefined;
    const context = createContext(authPayload);

    await runContext(context, async () => {
      try {
        if (permissionValidator) {
          await permissionValidator(endpoint);
        }

        const args = await decodeArgs(req);

        const schema = getSchema(handler);
        if (schema) {
          const parseResult = schema.safeParse(args);
          if (!parseResult.success) {
            res.set("Content-Type", CONTENT_TYPES.MSGPACK);
            res.status(HTTP_STATUS.BAD_REQUEST).send(
              encode({ message: "Validation failed", issues: parseResult.error.issues }),
            );
            return;
          }
        }

        const result = await handler.call(null, ...args);
        sendSuccess(res, result);
      } catch (error) {
        sendError(res, error);
      }
    });
  };

  return rpcMiddleware;
}
