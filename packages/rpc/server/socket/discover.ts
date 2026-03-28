/**
 * Socket Namespace Discovery
 *
 * Discovers NamespaceManager instances from service modules.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { NamespaceManager } from "./namespace.ts";
import type { ServiceDiscovery } from "../discovery.ts";

export interface DiscoveredNamespace {
  endpoint: string;
  manager: NamespaceManager;
}

/**
 * Discovers all socket namespaces from service modules.
 *
 * @param discovery - Service discovery instance
 * @returns Array of discovered namespaces with their endpoints
 */
export async function discoverSocketNamespaces(
  discovery: ServiceDiscovery,
): Promise<DiscoveredNamespace[]> {
  const namespaces: DiscoveredNamespace[] = [];

  for await (const relativePath of discovery.findServices()) {
    const absolutePath = path.join(discovery.servicesDir, relativePath);
    const moduleUrl = pathToFileURL(absolutePath).href;
    const publicUrl = discovery.toPublicUrl(relativePath);

    const module = await import(moduleUrl);

    for (const [exportName, exportValue] of Object.entries(module)) {
      if (exportValue instanceof NamespaceManager) {
        const endpoint = discovery.getEndpointPath(publicUrl, exportName);
        namespaces.push({ endpoint, manager: exportValue });
      }
    }
  }

  return namespaces;
}
