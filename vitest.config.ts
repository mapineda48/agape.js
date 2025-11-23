import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./web"),
      "@utils": path.resolve(__dirname, "./lib/utils"),
      "@agape/access": path.resolve(__dirname, "./web/test/mocks/access.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./web/test/setup.ts",
  },
});
