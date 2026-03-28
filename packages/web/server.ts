import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Server } from "node:http";
import { createServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pkgRoot = __dirname;

export async function createDevMiddleware(httpServer: Server) {
  const vite = await createServer({
    root: pkgRoot,
    appType: "spa",
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
    },
  });

  return vite.middlewares;
}
