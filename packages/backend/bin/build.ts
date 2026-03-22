/**
 * Post-build script for production deployment preparation.
 *
 * This script runs after TypeScript compilation (with tsc-alias) and Vite build to:
 * 1. Flatten tsc output structure
 * 2. Copy frontend build output into backend dist
 * 3. Reorganize distribution files
 * 4. Copy static assets (SQL migrations)
 * 5. Move source maps
 * 6. Generate production package.json
 * 7. Generate permissions map
 * 8. Pre-render SSG pages
 *
 * Frontend-specific build tasks are delegated to @agape/frontend/server/build.
 *
 * @module bin/build
 */

import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { name, version, type, dependencies } from "../package.json";
import { version as sharedVersion } from "../../shared/package.json";
import { compilerOptions } from "../tsconfig.json";
import {
  buildPermissionMap,
  generateJavaScriptModule,
} from "../lib/rpc/rbac/extract-permissions";

// Frontend build tasks
import {
  copyFrontendBuild,
  reorganizeDistFiles,
  moveSourceMaps,
  preRenderSSGPages,
} from "@agape/frontend/server/build";

// ============================================================================
// Constants
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..");
const DIST = path.resolve(BACKEND_ROOT, "dist");

/** Import path aliases from tsconfig (used for production package.json generation) */
const IMPORT_ALIASES = Object.fromEntries(
  Object.entries(compilerOptions.paths)
    .filter(([alias]) => alias !== "#shared/*") // #shared is handled separately
    .map(([alias, [pattern]]) => [alias, pattern]),
);

/**
 * Normalizes an import path entry from package.json imports field.
 */
function normalizeImportPath([key, pattern]: [string, string]): [
  string,
  string,
] {
  let normalizedPattern = pattern;

  if (!normalizedPattern.startsWith("./")) {
    normalizedPattern = `./${normalizedPattern}`;
  }

  if (normalizedPattern.endsWith(".ts")) {
    normalizedPattern = normalizedPattern.replace(".ts", ".js");
  }

  return [key, normalizedPattern];
}

// ============================================================================
// Build Tasks
// ============================================================================

/**
 * Flattens the tsc output structure.
 *
 * Because rootDir covers both backend/ and shared/ (to compile shared
 * imports), tsc emits to dist/backend/ and dist/shared/. This step
 * moves everything up so dist/ has the expected flat structure.
 *
 * The #shared/* imports are preserved as subpath imports by the
 * preserve-shared-imports.js tsc-alias replacer, and resolved at
 * runtime via the package.json "imports" field.
 */
async function flattenTscOutput(): Promise<void> {
  console.log(chalk.blue("📁 Flattening tsc output structure..."));

  try {
    const backendDist = path.join(DIST, "backend");

    if (fs.existsSync(backendDist)) {
      for (const entry of await fs.readdir(backendDist)) {
        await fs.move(
          path.join(backendDist, entry),
          path.join(DIST, entry),
          { overwrite: true },
        );
      }
      await fs.remove(backendDist);
      console.log(chalk.gray("  ✓ Flattened dist/backend/ → dist/"));
    }

    // Remove dist/shared/ — production resolves #shared/* via @mapineda48/agape npm package
    const sharedDist = path.join(DIST, "shared");
    if (fs.existsSync(sharedDist)) {
      await fs.remove(sharedDist);
      console.log(chalk.gray("  ✓ Removed dist/shared/ (resolved via npm in production)"));
    }

    console.log(chalk.green("✓ tsc output flattened\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to flatten tsc output:"), error);
    throw error;
  }
}

/**
 * Copies static assets required for production.
 */
async function copyStaticAssets(): Promise<void> {
  console.log(chalk.blue("📦 Copying static assets..."));

  try {
    const sourcePath = path.join(BACKEND_ROOT, "lib/db/migrations/scripts");
    const destPath = path.join(DIST, "lib/db/migrations/scripts");

    await fs.copy(sourcePath, destPath);
    console.log(chalk.gray("  ✓ Copied SQL migration scripts"));
    console.log(chalk.green("✓ Static assets copied\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to copy static assets:"), error);
    throw error;
  }
}

/**
 * Generates production package.json with minimal configuration.
 */
async function generateProductionPackageJson(): Promise<void> {
  console.log(chalk.blue("📝 Generating production package.json..."));

  try {
    // Remove workspace reference, add published shared package as real dependency
    const workspaceDeps = ["@mapineda48/agape", "@mapineda48/agape-rpc"];
    const backendDeps = Object.fromEntries(
      Object.entries(dependencies).filter(([key]) => !workspaceDeps.includes(key)),
    );

    const productionPackage = {
      name,
      version,
      type,
      dependencies: {
        ...backendDeps,
        "@mapineda48/agape": sharedVersion,
        "@mapineda48/agape-rpc": sharedVersion,
      },
      scripts: {
        start: "node bin/index.js",
        cluster: "node bin/cluster.js",
      },
      imports: {
        "#shared/*": "@mapineda48/agape/*",
        ...Object.fromEntries(
          Object.entries(IMPORT_ALIASES).map(normalizeImportPath),
        ),
      },
    };

    await fs.outputJSON(path.join(DIST, "package.json"), productionPackage, { spaces: 2 });

    console.log(chalk.gray("  ✓ Created dist/package.json"));
    console.log(chalk.green("✓ Production package.json generated\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to generate package.json:"), error);
    throw error;
  }
}

/**
 * Generates the RPC permissions map for production.
 */
async function generatePermissions(): Promise<void> {
  console.log(chalk.blue("🔐 Generating production permissions map..."));

  try {
    const permissions = await buildPermissionMap();
    const jsCode = generateJavaScriptModule(permissions);

    const outputPath = path.join(DIST, "lib/rpc/permissions.generated.js");
    await fs.writeFile(outputPath, jsCode, "utf8");

    console.log(chalk.gray(`  ✓ Wrote permissions to ${outputPath}`));
    console.log(chalk.green("✓ Permissions map generated\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to generate permissions:"), error);
    throw error;
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  console.log(chalk.bold.cyan("\n🚀 Running post-build tasks...\n"));

  const startTime = Date.now();

  try {
    await flattenTscOutput();
    await copyFrontendBuild(DIST);
    await reorganizeDistFiles(DIST);
    await copyStaticAssets();
    await moveSourceMaps(DIST);
    await generateProductionPackageJson();
    await generatePermissions();
    await preRenderSSGPages(DIST);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      chalk.bold.green(
        `✨ All build tasks completed successfully in ${duration}s\n`,
      ),
    );
  } catch (error) {
    console.error(chalk.bold.red("\n❌ Build failed:"), error);
    process.exit(1);
  }
}

main();
