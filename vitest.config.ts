import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // qué archivos se consideran tests
    include: [
      "tests/**/*.test.{ts,tsx}",
      "tests/**/*.spec.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
    ],
    exclude: ["dist", "web"],
    // para tu caso de servicio puedes seguir usando:
    // `vitest run tests/svc --runInBand`
    // y Vitest limitará a esa carpeta igual.
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
});
