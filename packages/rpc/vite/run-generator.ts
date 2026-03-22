/**
 * Generator runner script.
 * Called by the Vite plugin via child process.
 *
 * Usage: tsx vite/run-generator.ts <servicesDir> <namespace>
 */

import { generateVirtualModules, addStaticModules } from "./generator.ts";

const servicesDir = process.argv[2];
const namespace = process.argv[3];

if (!servicesDir || !namespace) {
  console.error("Usage: tsx vite/run-generator.ts <servicesDir> <namespace>");
  process.exit(1);
}

const virtualModules = await generateVirtualModules(servicesDir);
addStaticModules(virtualModules);

console.log(JSON.stringify(virtualModules));
