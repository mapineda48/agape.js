import path from "node:path";
import crypto from "node:crypto";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vitePluginRpc from "./lib/rpc/vite-plugin";

const cwd = process.cwd();
const pages = path.resolve("web/app");
const web = path.resolve("web");

console.log(cwd);

// función para generar un hash corto (8 chars) de una cadena
function hashOf(facadeModuleId: string, len = 8) {
  const rel = path.relative(cwd, facadeModuleId);

  return crypto.createHash("sha256").update(rel).digest("hex").slice(0, len);
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vitePluginRpc,
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],

  root: "web",

  resolve: {
    alias: {
      // ej. @ apunta a src
      "@": path.resolve("web"),
      "@utils": path.resolve("lib/utils"),
    },
  },

  build: {
    outDir: path.resolve("dist/web/www/"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: "[name].[hash].js",

        chunkFileNames: (chunkInfo) => {
          if (!chunkInfo.name.startsWith("vendor/")) {
            return "[name].[hash].js";
          }

          // los chunks sin moduleId (p.e. bundling interno)
          return "assets/js/[name].[hash].js";
        },

        manualChunks(id) {
          if (id.startsWith(web)) {
            return hashOf(id, 12);
          }

          // sólo node_modules
          if (!id.includes("node_modules")) return;

          // dividimos por cualquier "node_modules/" (soporta pnpm y npm/yarn)
          const parts = id.split(/node_modules[\\/]/).filter(Boolean);
          // el último fragmento será "axios/…", "@babel/core/…" o ".pnpm/axios@1.2.3/…"
          const pkgPath = parts[parts.length - 1];
          const segments = pkgPath.split(/[\\/]/);
          // si es scopeado (@foo/bar) cojo los dos primeros segmentos
          const pkgName = segments[0].startsWith("@")
            ? segments.slice(0, 2).join("/")
            : segments[0];

          return path.posix.join("vendor", pkgName);
        },
      },
    },
  },
});
