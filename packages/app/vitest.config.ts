import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    maxConcurrency: 3,
    maxWorkers: 3,
    testTimeout: 30000,
    hookTimeout: 30000,
    name: "app",
    environment: "node",
    root: path.resolve(__dirname),
    include: ["services/**/*.test.ts", "lib/**/*.test.ts"],
    exclude: ["dist"],
  },
});
