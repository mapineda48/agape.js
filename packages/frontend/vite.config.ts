import path from "node:path";
import crypto from "node:crypto";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import virtualModulePlugin from "../backend/lib/vite/vite-plugin";

const cwd = process.cwd();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    virtualModulePlugin,
  ],

  resolve: {
    alias: {
      "#web": path.resolve(__dirname),
      "#shared": path.resolve(__dirname, "../shared"),
    },
  },

  build: {
    outDir: path.resolve(__dirname, "dist/www"),
    emptyOutDir: true,
    sourcemap: true,
    ssrManifest: true,
    rollupOptions: {
      output: {
        entryFileNames: "[name].[hash].js",

        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name.startsWith("vendor/")) {
            return `assets/js/[name].[hash].js`;
          }

          const facadeModuleId =
            chunkInfo.facadeModuleId || chunkInfo.moduleIds.at(-1) || "";

          const rel = path.relative(cwd, facadeModuleId);

          const hash = crypto
            .createHash("sha256")
            .update(rel)
            .digest("hex")
            .slice(0, 10);

          return `${hash}.[hash].js`;
        },

        manualChunks(id) {
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
