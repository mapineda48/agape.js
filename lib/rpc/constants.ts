/**
 * RPC Module Constants
 *
 * Centralized constants used across the RPC module for consistency
 * and easier maintenance.
 */

/**
 * Content-Type header values supported by the RPC system.
 */
export const CONTENT_TYPES = {
    MSGPACK: "application/msgpack",
    MULTIPART: "multipart/form-data",
} as const;

/**
 * HTTP status codes used in RPC responses.
 */
export const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Virtual module namespace for Vite plugin.
 */
export const VIRTUAL_MODULE_NAMESPACE = "@agape";

/**
 * Virtual module prefix used by Vite for internal resolution.
 */
export const VIRTUAL_MODULE_PREFIX = "\0";
