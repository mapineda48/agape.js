import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "frontend",
    environment: "jsdom",
    globals: true,
    setupFiles: "./__test__/setup.ts",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", "dist"],
  },
  resolve: {
    alias: {
      "#web": path.resolve(__dirname),
      "#shared": path.resolve(__dirname, "../shared"),
      "#services": path.resolve(__dirname, "./__test__/mocks/services"),
    },
  },
});
