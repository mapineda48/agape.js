/**
 * Server-side facades for the web package.
 *
 * Exports Vite dev server factory and package paths.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Root directory of the web package */
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
    appType: "custom",
  });
}
