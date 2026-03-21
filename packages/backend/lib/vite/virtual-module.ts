/**
 * Virtual Module Generator
 *
 * Generates JavaScript code for virtual modules that provide type-safe
 * RPC client functions for each service endpoint.
 *
 * This script is executed by the Vite plugin to create virtual modules
 * that can be imported as `@agape/...` in the frontend.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { cwd, findServices, toPublicUrl } from "../rpc/path";
import { VIRTUAL_MODULE_ID, VIRTUAL_MODULE_PREFIX } from "./constants";
import { NamespaceManager } from "../socket/namespace";
import Schema from "../db/schema";

Schema.setSchemaName(import.meta.filename);

// ============================================================================
// Types
// ============================================================================

/** Map of virtual module IDs to their generated JavaScript code */
type VirtualModuleMap = Record<string, string>;

/** A module's exported members */
type ModuleExports = Record<string, unknown>;

// ============================================================================
// Code Generation
// ============================================================================

/**
 * Import statement for the RPC client factory.
 */
const RPC_IMPORT = 'import makeRcp from "#web/utils/rpc";';
const SOCKET_IMPORT = 'import makeSocket from "#web/utils/socket";';

/**
 * Generates the JavaScript code for a virtual module.
 *
 * Each exported function from the service module becomes an RPC client
 * function in the virtual module.
 *
 * @param moduleUrl - The public URL path of the module
 * @param exports - The module's exports
 * @returns Array of JavaScript lines
 */
function generateModuleCode(
  moduleUrl: string,
  exports: ModuleExports,
): string[] {
  const lines: string[] = [];

  for (const [exportName, exportValue] of Object.entries(exports)) {
    if (typeof exportValue === "function") {
      if (!lines.includes(RPC_IMPORT)) {
        lines.unshift(RPC_IMPORT);
      }

      const endpoint = getEndpointUrl(moduleUrl, exportName);

      if (exportName === "default") {
        lines.push(`export default makeRcp("${endpoint}");`);
      } else {
        lines.push(`export const ${exportName} = makeRcp("${endpoint}");`);
      }

      continue;
    }

    if (exportValue instanceof NamespaceManager) {
      if (!lines.includes(SOCKET_IMPORT)) {
        lines.unshift(SOCKET_IMPORT);
      }

      const endpoint = getEndpointUrl(moduleUrl, exportName);

      if (exportName === "default") {
        lines.push(`export default makeSocket("${endpoint}");`);
      } else {
        lines.push(`export const ${exportName} = makeSocket("${endpoint}");`);
      }

      continue;
    }
  }

  return lines;
}

/**
 * Gets the full endpoint URL for an export.
 *
 * Default exports map to the module root.
 * Named exports append the export name.
 */
function getEndpointUrl(moduleUrl: string, exportName: string): string {
  return exportName === "default"
    ? path.posix.join("/", moduleUrl)
    : path.posix.join("/", moduleUrl, exportName);
}

/**
 * Converts a public URL to a virtual module ID.
 *
 * Virtual module IDs are prefixed with the null character (\0) to
 * indicate to Vite that they are virtual.
 */
function toVirtualModuleId(moduleUrl: string): string {
  return VIRTUAL_MODULE_PREFIX + path.posix.join(VIRTUAL_MODULE_ID, moduleUrl);
}

// ============================================================================
// Module Discovery and Generation
// ============================================================================

/**
 * Discovers all service modules and generates their virtual module code.
 */
async function generateVirtualModules(): Promise<VirtualModuleMap> {
  const virtualModules: VirtualModuleMap = {};

  for await (const relativePath of findServices()) {
    const absolutePath = path.join(cwd, relativePath);
    const moduleUrl = pathToFileURL(absolutePath).href;
    const publicUrl = toPublicUrl(relativePath);

    const module = (await import(moduleUrl)) as ModuleExports;
    const code = generateModuleCode(publicUrl, module);
    const virtualId = toVirtualModuleId(publicUrl);

    virtualModules[virtualId] = code.join("\n");
  }

  return virtualModules;
}

/**
 * Adds static virtual modules that don't come from service files.
 */
function addStaticModules(modules: VirtualModuleMap): void {
  // Security access module - use same convention as dynamic modules
  const securityModuleId =
    VIRTUAL_MODULE_PREFIX + VIRTUAL_MODULE_ID + "/security/session";
  modules[securityModuleId] = "export * from '#web/utils/session'";
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Build and output the virtual module map.
 *
 * The output is JSON that will be consumed by the Vite plugin.
 */
async function main(): Promise<void> {
  const virtualModules = await generateVirtualModules();
  addStaticModules(virtualModules);

  // Output as JSON for the Vite plugin to consume
  console.log(JSON.stringify(virtualModules));
}

// Execute when run as a script
await main();
