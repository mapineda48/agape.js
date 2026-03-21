import path from "node:path";
import { defineConfig } from "vite";

/**
 * Vite config for SSR bundle build.
 * Produces a single entry-server.js without hash in filename.
 */
export default defineConfig({
  resolve: {
    alias: {
      "#web": path.resolve(__dirname),
      "#shared": path.resolve(__dirname, "../shared"),
    },
  },

  build: {
    rollupOptions: {
      // Externalize virtual module imports (#services/*) that are only
      // available in the client build via the Vite virtual module plugin.
      // SSR pages should not use RPC services directly.
      external: (id) => id.startsWith("#services/"),
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
