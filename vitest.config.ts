import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    projects: [
      {
        // Proyecto backend (Node, svc/lib/models)
        test: {
          name: "backend",
          environment: "node",
          root: path.resolve(__dirname), // importante: raíz del repo
          include: ["svc/**/*.test.ts", "lib/**/*.test.ts"],
          exclude: ["dist", "web"],
        },
        resolve: {
          alias: {
            "#utils": path.resolve(__dirname, "lib/utils"),
            "#models": path.resolve(__dirname, "models"),
            "#lib": path.resolve(__dirname, "lib"),
            "#svc": path.resolve(__dirname, "svc"),
            "#session": path.resolve(__dirname, "lib/access/session.ts"),
            "#logger": path.resolve(__dirname, "lib/log/logger.ts"),
          },
        },
      },
      {
        test: {
          name: "frontend",
          environment: "jsdom",
          globals: true,
          setupFiles: "./web/test/setup.ts",
          include: ["web/**/*.test.ts"],
        },
        plugins: [react()],
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./web"),
            "@utils": path.resolve(__dirname, "./lib/utils"),
            "@agape/access": path.resolve(
              __dirname,
              "./web/test/mocks/access.ts"
            ),
            "@agape/spa": path.resolve(__dirname, "./web/test/mocks/spa.ts"),
            "@agape/cms/inventory/configuration/category": path.resolve(
              __dirname,
              "./web/test/mocks/category.ts"
            ),
          },
        },
      },
    ],
  },
});
