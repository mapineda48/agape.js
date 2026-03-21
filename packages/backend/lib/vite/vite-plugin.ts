/**
 * Vite Plugin for Virtual RPC Modules
 *
 * This plugin enables importing RPC client functions using the `@agape/...`
 * namespace. It dynamically generates client code for each service endpoint.
 *
 * @example
 * // In frontend code:
 * import { getUsers, createUser } from "@agape/users";
 * const users = await getUsers();
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import type { Plugin } from "vite";
import {
  VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_NAMESPACE,
  VIRTUAL_MODULE_PREFIX,
} from "./constants";

// ============================================================================
// Types
// ============================================================================

/** Map of virtual module IDs to their JavaScript code */
type VirtualModuleMap = Record<string, string>;

// ============================================================================
// Module Generation
// ============================================================================

const execAsync = promisify(exec);

/** Backend package root (two levels up from lib/vite/) */
const BACKEND_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/**
 * Command to generate virtual module definitions.
 *
 * Runs the virtual-module.ts script using tsx with the backend tsconfig.
 */
const GENERATE_MODULES_CMD =
  "tsx --tsconfig tsconfig.json lib/vite/virtual-module.ts";

/**
 * Executes the virtual module generator and parses the output.
 */
async function loadVirtualModules(): Promise<VirtualModuleMap> {
  const { stdout } = await execAsync(GENERATE_MODULES_CMD, {
    cwd: BACKEND_ROOT,
  });
  return JSON.parse(stdout.toString()) as VirtualModuleMap;
}

// ============================================================================
// Plugin Definition
// ============================================================================

/**
 * Pre-load virtual modules during plugin initialization.
 */
const virtualModules = await loadVirtualModules();

/**
 * Vite plugin that provides virtual modules for RPC client functions.
 *
 * Features:
 * - Resolves `@agape/*` imports as virtual modules
 * - Generates type-safe RPC client functions
 * - Works in both development and production builds
 */
const vitePluginRpc: Plugin = {
  name: "virtual-agape-plugin",

  // Execute before other plugins (especially Rollup)
  enforce: "pre",

  // Apply in both dev and build modes
  apply: () => true,

  /**
   * Resolves module IDs starting with `@agape` as virtual modules.
   *
   * Virtual modules are prefixed with `\0` to indicate they don't
   * correspond to actual files on disk.
   */
  resolveId(id: string): string | undefined {
    if (id.startsWith(VIRTUAL_MODULE_NAMESPACE)) {
      return (
        VIRTUAL_MODULE_PREFIX +
        id.replace(VIRTUAL_MODULE_NAMESPACE, VIRTUAL_MODULE_ID)
      );
    }
  },

  /**
   * Loads the code for virtual modules.
   *
   * Returns the pre-generated JavaScript code for the requested
   * virtual module ID.
   */
  load(id: string): string | undefined {
    return virtualModules[id];
  },
};

export default vitePluginRpc;
