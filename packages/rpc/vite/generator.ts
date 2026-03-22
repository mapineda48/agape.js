/**
 * Virtual Module Generator
 *
 * Generates JavaScript code for virtual modules that provide type-safe
 * RPC client functions for each service endpoint.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { createServiceDiscovery } from "../server/discovery.ts";
import { VIRTUAL_MODULE_ID, VIRTUAL_MODULE_PREFIX } from "./constants.ts";

/**
 * Well-known symbol shared with @mapineda48/agape/services/contract.ts
 * Used to detect socket namespace contracts without a direct dependency.
 */
const SOCKET_NAMESPACE = Symbol.for("agape-rpc:socket-namespace");

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
 * Import statements for the RPC client and socket factories.
 * These import from the @mapineda48/agape-rpc package.
 */
const RPC_IMPORT = 'import makeRcp from "@mapineda48/agape-rpc/client/rpc";';
const SOCKET_IMPORT = 'import makeSocket from "@mapineda48/agape-rpc/client/socket";';

/**
 * Checks if an export is a socket namespace contract (marked with the well-known symbol).
 */
function isSocketContract(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    SOCKET_NAMESPACE in value
  );
}

/**
 * Generates the JavaScript code for a virtual module.
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

    if (isSocketContract(exportValue)) {
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
 */
function getEndpointUrl(moduleUrl: string, exportName: string): string {
  return exportName === "default"
    ? path.posix.join("/", moduleUrl)
    : path.posix.join("/", moduleUrl, exportName);
}

/**
 * Converts a public URL to a virtual module ID.
 */
function toVirtualModuleId(moduleUrl: string): string {
  return VIRTUAL_MODULE_PREFIX + path.posix.join(VIRTUAL_MODULE_ID, moduleUrl);
}

// ============================================================================
// Module Discovery and Generation
// ============================================================================

/**
 * Discovers all service modules and generates their virtual module code.
 *
 * @param servicesDir - Absolute path to the services directory
 */
export async function generateVirtualModules(servicesDir: string): Promise<VirtualModuleMap> {
  const virtualModules: VirtualModuleMap = {};
  const discovery = createServiceDiscovery(servicesDir);

  for await (const relativePath of discovery.findServices()) {
    const absolutePath = path.join(servicesDir, relativePath);
    const moduleUrl = pathToFileURL(absolutePath).href;
    const publicUrl = discovery.toPublicUrl(relativePath);

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
export function addStaticModules(modules: VirtualModuleMap): void {
  const securityModuleId =
    VIRTUAL_MODULE_PREFIX + VIRTUAL_MODULE_ID + "/security/session";
  modules[securityModuleId] = "export * from '#web/utils/session'";
}
