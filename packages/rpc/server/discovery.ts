/**
 * Service Discovery Module
 *
 * Provides utilities for discovering service files and converting
 * file paths to URL-friendly formats for the RPC system.
 *
 * Unlike the original path.ts, this module is parameterized with servicesDir
 * instead of using a hardcoded path relative to the module location.
 */

import { glob } from "node:fs/promises";
import path from "node:path";

// ============================================================================
// Configuration
// ============================================================================

/** Glob patterns to exclude from service discovery */
const EXCLUDED_PATTERNS = ["**/*.d.ts", "**/*.test.ts", "**/contract.ts"];

// ============================================================================
// Types
// ============================================================================

export interface ServiceDiscovery {
  /** Absolute path to the services directory */
  servicesDir: string;
  /** Async iterable of service file paths relative to servicesDir */
  findServices(): AsyncIterable<string>;
  /** Converts a relative file path to a public URL */
  toPublicUrl(filename: string, ...chunks: string[]): string;
  /** Generates the endpoint path for an exported function */
  getEndpointPath(moduleUrl: string, exportName: string): string;
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Creates a service discovery instance for a given services directory.
 *
 * @param servicesDir - Absolute path to the services directory
 * @param moduleExtension - File extension to look for (default: auto-detect from runtime)
 */
export function createServiceDiscovery(
  servicesDir: string,
  moduleExtension?: string,
): ServiceDiscovery {
  const ext = moduleExtension ?? detectModuleExtension();
  const serviceFilePattern = `**/*${ext}`;

  function findServices() {
    return glob(serviceFilePattern, {
      cwd: servicesDir,
      exclude: EXCLUDED_PATTERNS,
    });
  }

  function toPublicUrl(filename: string, ...chunks: string[]): string {
    return toUrl("/", filename, ext, ...chunks);
  }

  function getEndpointPath(moduleUrl: string, exportName: string): string {
    const suffix = exportName !== "default" ? exportName : "";
    return path.posix.join("/", moduleUrl, suffix);
  }

  return {
    servicesDir,
    findServices,
    toPublicUrl,
    getEndpointPath,
  };
}

// ============================================================================
// Path Conversion Utilities
// ============================================================================

/**
 * Detects the module extension based on the current runtime.
 * In dev (tsx), files are .ts; in production (compiled), files are .js.
 */
function detectModuleExtension(): string {
  return import.meta.filename.endsWith(".ts") ? ".ts" : ".js";
}

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
 * Strips the extension and index segments from a module path.
 */
function stripModuleSuffix(modulePath: string, ext: string): string {
  return modulePath
    .replace(ext, "")
    .replace("/index", "")
    .replace("index", "");
}

/**
 * Converts a file path to a URL path.
 */
function toUrl(root: string, filename: string, ext: string, ...chunks: string[]): string {
  const posixPath = toPosixPath(filename);
  const moduleUrl = stripModuleSuffix(posixPath, ext);

  return path.posix.join(root, moduleUrl, ...chunks);
}
