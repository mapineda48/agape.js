/**
 * Socket.IO RPC Module Constants
 *
 * Centralized constants used across the Socket.IO RPC module.
 */

/**
 * File pattern for socket module files.
 * Files ending with .socket.ts are considered socket modules.
 */
export const SOCKET_FILE_SUFFIX = ".socket";

/**
 * RPC method event prefix used for socket.io emit/on.
 */
export const RPC_METHOD_PREFIX = "rpc:";

/**
 * RPC response event suffix.
 */
export const RPC_RESPONSE_SUFFIX = ":response";

/**
 * RPC error event suffix.
 */
export const RPC_ERROR_SUFFIX = ":error";

