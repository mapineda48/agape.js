/**
 * Vite Plugin for Virtual RPC Modules
 *
 * This plugin enables importing RPC client functions using the `#services/...`
 * namespace. It dynamically generates client code for each service endpoint.
 *
 * @example
 * ```ts
 * // In vite.config.ts:
 * import { createVitePlugin } from "@mapineda48/agape-rpc/vite/plugin";
 * import { servicesDir } from "@mapineda48/agape-core";
 *
 * export default defineConfig({
 *   plugins: [createVitePlugin(servicesDir)],
 * });
 * ```
 */

import path from "node:path";
import { promisify } from "node:util";
import { exec } from "node:child_process";
import type { Plugin } from "vite";
import {
  VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_PREFIX,
} from "./constants.ts";

// ============================================================================
// Types
// ============================================================================

/** Map of virtual module IDs to their JavaScript code */
type VirtualModuleMap = Record<string, string>;

// ============================================================================
// Module Generation
// ============================================================================

const execAsync = promisify(exec);

/**
 * Loads virtual modules by running the generator script.
 *
 * @param servicesDir - Absolute path to the shared services directory
 */
async function loadVirtualModules(servicesDir: string, namespace: string): Promise<VirtualModuleMap> {
  const rpcPkgRoot = path.resolve(
    path.dirname(import.meta.filename),
    "..",
  );

  const generatorScript = path.join(rpcPkgRoot, "vite", "run-generator.ts");

  // Run from the shared package root (parent of servicesDir)
  // so that #shared/* aliases resolve correctly.
  const sharedRoot = path.dirname(servicesDir);
  const sharedTsconfig = path.join(sharedRoot, "tsconfig.json");

  const cmd = `tsx --tsconfig ${sharedTsconfig} ${generatorScript} ${servicesDir} ${namespace}`;

  const { stdout } = await execAsync(cmd, {
    cwd: sharedRoot,
  });

  return JSON.parse(stdout.toString()) as VirtualModuleMap;
}

// ============================================================================
// Plugin Factory
// ============================================================================

/**
 * Creates a Vite plugin that provides virtual modules for RPC client functions.
 *
 * @param servicesDir - Absolute path to the shared services directory (domain contracts)
 * @param namespace - The import prefix to intercept (e.g., `"@mapineda48/agape-core/services"`)
 * @returns Vite plugin
 */
export function createVitePlugin(servicesDir: string, namespace: string): Plugin {
  let virtualModules: VirtualModuleMap = {};

  return {
    name: "virtual-agape-rpc-plugin",
    enforce: "pre",
    apply: () => true,

    async buildStart() {
      virtualModules = await loadVirtualModules(servicesDir, namespace);
    },

    resolveId(id: string): string | undefined {
      if (id.startsWith(namespace)) {
        return (
          VIRTUAL_MODULE_PREFIX +
          id.replace(namespace, VIRTUAL_MODULE_ID)
        );
      }
    },

    load(id: string): string | undefined {
      return virtualModules[id];
    },
  };
}

export default createVitePlugin;
