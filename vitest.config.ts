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
    ],
  },
});
