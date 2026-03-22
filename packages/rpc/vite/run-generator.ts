/**
 * Generator runner script.
 * Called by the Vite plugin via child process.
 *
 * Usage: tsx vite/run-generator.ts <servicesDir>
 */

import { generateVirtualModules, addStaticModules } from "./generator.ts";

const servicesDir = process.argv[2];

if (!servicesDir) {
  console.error("Usage: tsx vite/run-generator.ts <servicesDir>");
  process.exit(1);
}

const virtualModules = await generateVirtualModules(servicesDir);
addStaticModules(virtualModules);

console.log(JSON.stringify(virtualModules));
