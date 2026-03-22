/**
 * Server-side facades for the frontend package.
 *
 * Backend imports from here to access frontend resources
 * without directly depending on Vite or knowing frontend internals.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Root directory of the frontend package */
export const frontendPkgRoot = path.resolve(__dirname, "..");

/**
 * Creates a Vite dev server in middleware mode.
 * Only used during development — dynamically imports Vite to avoid
 * requiring it as a production dependency.
 */
export async function createViteServer() {
  const { createServer } = await import("vite");

  return createServer({
    root: frontendPkgRoot,
    configFile: path.resolve(frontendPkgRoot, "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "custom", // We handle HTML serving ourselves for SSR
  });
}
