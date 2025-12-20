/**
 * Virtual Module Generator
 *
 * Generates JavaScript code for virtual modules that provide type-safe
 * RPC client functions for each service endpoint, and Socket.IO clients
 * for socket modules.
 *
 * This script is executed by the Vite plugin to create virtual modules
 * that can be imported as `@agape/...` in the frontend.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from "fs-extra";
import { cwd, svc, toPublicUrl } from "./path";
import { cwd as socketCwd, sockets, toPublicUrl as toSocketPublicUrl } from "../socket/path";
import { VIRTUAL_MODULE_NAMESPACE, VIRTUAL_MODULE_PREFIX } from "./constants";

// ============================================================================
// Types
// ============================================================================

/** Map of virtual module IDs to their generated JavaScript code */
type VirtualModuleMap = Record<string, string>;

/** A module's exported members */
type ModuleExports = Record<string, unknown>;

// ============================================================================
// RPC Code Generation
// ============================================================================

/**
 * Import statement for the RPC client factory.
 */
const RPC_IMPORT = 'import makeRcp from "@/utils/rpc";';

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
  exports: ModuleExports
): string[] {
  const lines: string[] = [RPC_IMPORT];

  for (const [exportName, exportValue] of Object.entries(exports)) {
    if (typeof exportValue !== "function") {
      continue;
    }

    const endpoint = getEndpointUrl(moduleUrl, exportName);

    if (exportName === "default") {
      lines.push(`export default makeRcp("${endpoint}");`);
    } else {
      lines.push(`export const ${exportName} = makeRcp("${endpoint}");`);
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
  return VIRTUAL_MODULE_PREFIX + path.posix.join(VIRTUAL_MODULE_NAMESPACE, moduleUrl);
}

// ============================================================================
// Socket Code Generation
// ============================================================================

/**
 * Import statement for the Socket.IO client factory.
 */
const SOCKET_IMPORT = 'import createSocketClient from "@/utils/socket";';

/**
 * Generates the JavaScript code for a socket virtual module.
 *
 * @param namespace - The socket namespace (e.g., "/notifications")
 * @param exports - The module's exports
 * @returns Array of JavaScript lines
 */
function generateSocketModuleCode(
  namespace: string,
  exports: ModuleExports
): string[] {
  const lines: string[] = [SOCKET_IMPORT];

  // Extract event names
  const events: string[] = [];
  if (exports.events && typeof exports.events === "object") {
    events.push(...Object.keys(exports.events));
  }

  // Extract method names
  const methods: string[] = [];
  for (const [exportName, exportValue] of Object.entries(exports)) {
    if (exportName === "events" || exportName === "default") {
      continue;
    }
    if (typeof exportValue === "function") {
      methods.push(exportName);
    }
  }

  // Generate the client code
  lines.push("");
  lines.push(`const events = ${JSON.stringify(events)};`);
  lines.push(`const methods = ${JSON.stringify(methods)};`);
  lines.push("");
  lines.push(`export default createSocketClient("${namespace}", events, methods);`);

  return lines;
}

// ============================================================================
// Module Discovery and Generation
// ============================================================================

/**
 * Discovers all service modules and generates their virtual module code.
 */
async function generateVirtualModules(): Promise<VirtualModuleMap> {
  const virtualModules: VirtualModuleMap = {};

  for await (const relativePath of svc) {
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
 * Discovers all socket modules and generates their virtual module code.
 */
async function generateSocketVirtualModules(): Promise<VirtualModuleMap> {
  const virtualModules: VirtualModuleMap = {};

  for await (const relativePath of sockets) {
    const absolutePath = path.join(socketCwd, relativePath);
    const moduleUrl = pathToFileURL(absolutePath).href;
    const publicUrl = toSocketPublicUrl(relativePath);

    // Derive namespace from path (remove .socket or /socket suffix)
    const namespace = publicUrl.replace(/\.socket$/, "").replace(/\/socket$/, "") || "/";

    const module = (await import(moduleUrl)) as ModuleExports;
    const code = generateSocketModuleCode(namespace, module);
    const virtualId = toVirtualModuleId(publicUrl);

    virtualModules[virtualId] = code.join("\n");
  }

  return virtualModules;
}

/**
 * Adds static virtual modules that don't come from service files.
 */
function addStaticModules(modules: VirtualModuleMap): void {
  // Security access module
  const securityModuleId = VIRTUAL_MODULE_PREFIX + "@agape/security/access";
  modules[securityModuleId] = fs.readFileSync("lib/access/browser.js", "utf8");
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
  const socketModules = await generateSocketVirtualModules();

  // Merge all modules
  const allModules = { ...virtualModules, ...socketModules };

  addStaticModules(allModules);

  // Output as JSON for the Vite plugin to consume
  console.log(JSON.stringify(allModules));
}

// Execute when run as a script
await main();

