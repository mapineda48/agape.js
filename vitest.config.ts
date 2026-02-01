import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    projects: [
      {
        // Proyecto App (Node, svc/lib/models)
        test: {
          maxConcurrency: 3, // limita la cantidad de tests que se ejecutan simultáneamente por postgres
          maxWorkers: 3,
          testTimeout: 30000, // 30 segundos
          hookTimeout: 30000, // beforeAll / afterAll también
          name: "app",
          environment: "node",
          root: path.resolve(__dirname), // importante: raíz del repo
          include: ["svc/**/*.test.ts", "lib/**/*.test.ts"],
          exclude: ["dist", "web"],
          sequence: {
            groupOrder: 1,
          },
        },
        resolve: {
          alias: {},
        },
      },
      {
        test: {
          name: "frontend",
          environment: "jsdom",
          globals: true,
          setupFiles: "./web/__test__/setup.ts",
          include: ["web/**/*.test.ts", "web/**/*.test.tsx"],
          sequence: {
            groupOrder: 2,
          },
        },
        plugins: [react()],
        resolve: {
          alias: {
            "#web": path.resolve(__dirname, "./web"),
            "#shared": path.resolve(__dirname, "./shared"),
            "#services": path.resolve(
              __dirname,
              "./web/__test__/mocks/services",
            ),
          },
        },
      },
    ],
  },
});
