/**
 * Path Utilities Module
 *
 * Provides utilities for resolving service file paths and converting
 * them to URL-friendly formats for the RPC system.
 */

import { glob } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ============================================================================
// Configuration
// ============================================================================

/** Current file path (needed for ESM) */
const __filename = fileURLToPath(import.meta.url);

/** File extension of the current module */
const MODULE_EXTENSION = path.extname(__filename);

/** Glob pattern for finding service files */
const SERVICE_FILE_PATTERN = `**/*${MODULE_EXTENSION}`;

/** Glob patterns to exclude from service discovery */
const EXCLUDED_PATTERNS = ["**/*.d.ts", "**/*.test.ts"];

/** Directory containing this file */
const __dirname = path.dirname(__filename);

/** Root directory for service files (relative to this module's location) */
export const cwd = path.resolve(__dirname, "../../services");

// ============================================================================
// Service Discovery
// ============================================================================

/**
 * Async iterable of service file paths relative to the services directory.
 * Excludes TypeScript declaration files and test files.
 */
export function findServices() {
  return glob(SERVICE_FILE_PATTERN, {
    cwd,
    exclude: EXCLUDED_PATTERNS,
  });
}

// ============================================================================
// Path Conversion Utilities
// ============================================================================

/**
 * Converts a Windows-style path to POSIX format.
 *
 * This is necessary for consistent URL generation across platforms.
 *
 * @example
 * toPosixPath("C:\\Users\\file.ts") → "/c/Users/file.ts"
 * toPosixPath("/home/user/file.ts") → "/home/user/file.ts"
 *
 * @param inputPath - Path in either Windows or POSIX format
 * @returns Path in POSIX format
 */
function toPosixPath(inputPath: string): string {
  const isWindowsPath =
    inputPath.includes("\\") || /^[A-Za-z]:/.test(inputPath);

  if (!isWindowsPath) {
    return inputPath;
  }

  return inputPath
    // Replace backslashes with forward slashes
    .replace(/\\/g, "/")
    // Convert drive letter prefix (e.g., "C:") to POSIX format ("/c")
    .replace(/^([A-Za-z]):/, (_, drive: string) => `/${drive.toLowerCase()}`);
}

/**
 * Strips the extension and index segments from a module path.
 *
 * @example
 * stripModuleSuffix("users/index.ts") → "users"
 * stripModuleSuffix("products/create.ts") → "products/create"
 */
function stripModuleSuffix(modulePath: string): string {
  return modulePath
    .replace(MODULE_EXTENSION, "")
    .replace("/index", "")
    .replace("index", "");
}

/**
 * Converts a file path to a URL path.
 *
 * @param root - Root path prefix for the URL
 * @param filename - File path to convert
 * @param chunks - Additional path segments to append
 * @returns URL path
 */
export function toUrl(root: string, filename: string, ...chunks: string[]): string {
  const posixPath = toPosixPath(filename);
  const moduleUrl = stripModuleSuffix(posixPath);

  return path.posix.join(root, moduleUrl, ...chunks);
}

/**
 * Converts a file path to a public URL path.
 *
 * This is the primary function used to generate RPC endpoint URLs.
 *
 * @example
 * toPublicUrl("users/index.ts") → "/users"
 * toPublicUrl("products/create.ts", "validate") → "/products/create/validate"
 *
 * @param filename - File path relative to the services directory
 * @param chunks - Additional path segments to append
 * @returns Public URL path
 */
export function toPublicUrl(filename: string, ...chunks: string[]): string {
  return toUrl("/", filename, ...chunks);
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
 *
 * @param moduleUrl - Base URL path for the module
 * @param exportName - Name of the exported function
 * @returns Complete endpoint path
 */
export function getEndpointPath(moduleUrl: string, exportName: string): string {
  const suffix = exportName !== "default" ? exportName : "";
  return path.posix.join("/", moduleUrl, suffix);
}