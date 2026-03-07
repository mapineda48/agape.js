import type { NextConfig } from "next";
import path from "node:path";
import { execSync } from "node:child_process";

// Auto-generate service clients on startup (replaces Vite virtual modules).
// Uses regex-based introspection — no tsx, no DB, no infrastructure needed.
// Runs once when next.config.ts is loaded (dev start / build).
execSync("node lib/codegen/generate-services.cjs", {
  stdio: "inherit",
  cwd: path.resolve(__dirname),
});

const nextConfig: NextConfig = {
  reactCompiler: true,

  turbopack: {
    resolveAlias: {
      // Frontend aliases
      "#web": path.resolve("web"),
      "#shared": path.resolve("shared"),
      "#services": path.resolve("web/__generated__/services"),
      // Backend aliases (for Server Components calling services directly)
      "#lib": path.resolve("lib"),
      "#svc": path.resolve("services"),
      "#models": path.resolve("models"),
    },
  },

  serverExternalPackages: ["pg", "bcrypt", "msgpackr", "redis", "formidable"],
};

export default nextConfig;
