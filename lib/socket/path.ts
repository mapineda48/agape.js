/**
 * Socket Path Utilities Module
 *
 * Provides utilities for resolving socket file paths and converting
 * them to namespace-friendly formats for the Socket.IO RPC system.
 */

import { glob } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOCKET_FILE_SUFFIX } from "./constants";

// ============================================================================
// Configuration
// ============================================================================

/** Current file path (needed for ESM) */
const __filename = fileURLToPath(import.meta.url);

/** File extension of the current module */
const MODULE_EXTENSION = path.extname(__filename);

/** Glob pattern for finding socket files */
const SOCKET_FILE_PATTERN = `**/*${SOCKET_FILE_SUFFIX}${MODULE_EXTENSION}`;

/** Glob patterns to exclude from socket discovery */
const EXCLUDED_PATTERNS = ["**/*.d.ts", "**/*.test.ts"];

/** Root directory for service files */
export const cwd = path.resolve("svc");

// ============================================================================
// Socket Discovery
// ============================================================================

/**
 * Async iterable of socket file paths relative to the services directory.
 * Matches files ending with .socket.ts (or .socket.js in production).
 */
export const sockets = glob(SOCKET_FILE_PATTERN, {
    cwd,
    exclude: EXCLUDED_PATTERNS,
});

// ============================================================================
// Path Conversion Utilities
// ============================================================================

/**
 * Converts a Windows-style path to POSIX format.
 */
function toPosixPath(inputPath: string): string {
    const isWindowsPath =
        inputPath.includes("\\") || /^[A-Za-z]:/.test(inputPath);

    if (!isWindowsPath) {
        return inputPath;
    }

    return inputPath
        .replace(/\\/g, "/")
        .replace(/^([A-Za-z]):/, (_, drive: string) => `/${drive.toLowerCase()}`);
}

/**
 * Strips the socket suffix and extension from a module path.
 *
 * @example
 * stripSocketSuffix("notifications/socket.ts") → "notifications"
 * stripSocketSuffix("demo.socket.ts") → "demo"
 * stripSocketSuffix("chat/room.socket.ts") → "chat/room"
 */
function stripSocketSuffix(modulePath: string): string {
    return modulePath
        .replace(MODULE_EXTENSION, "")                    // Remove .ts or .js
        .replace(new RegExp(`${SOCKET_FILE_SUFFIX}$`), "") // Remove .socket at end
        .replace(/\/socket$/, "");                        // Remove /socket at end (for folder/socket.ts)
}

/**
 * Converts a socket file path to a Socket.IO namespace.
 *
 * @example
 * toNamespace("notifications/socket.ts") → "/notifications"
 * toNamespace("chat/room.socket.ts") → "/chat/room"
 *
 * @param filename - File path relative to the services directory
 * @returns Socket.IO namespace path
 */
export function toNamespace(filename: string): string {
    const posixPath = toPosixPath(filename);
    const namespace = stripSocketSuffix(posixPath);

    // Ensure namespace starts with /
    return namespace.startsWith("/") ? namespace : `/${namespace}`;
}

/**
 * Converts a socket file path to a public URL for the virtual module.
 *
 * @example
 * toPublicUrl("notifications/socket.ts") → "/notifications/socket"
 *
 * @param filename - File path relative to the services directory
 * @returns Public URL path
 */
export function toPublicUrl(filename: string): string {
    const posixPath = toPosixPath(filename);
    const url = posixPath.replace(MODULE_EXTENSION, "");

    return url.startsWith("/") ? url : `/${url}`;
}
