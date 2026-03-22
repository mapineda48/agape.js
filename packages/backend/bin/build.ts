/**
 * Post-build script for production deployment preparation.
 *
 * This script runs after TypeScript compilation to:
 * 1. Copy frontend build output into backend dist
 * 2. Reorganize distribution files
 * 3. Copy static assets (SQL migrations)
 * 4. Move source maps
 * 5. Generate production package.json
 * 6. Generate permissions map
 * 7. Pre-render SSG pages
 *
 * Frontend-specific build tasks are delegated to @agape/frontend/server/build.
 *
 * @module bin/build
 */

import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import pkg from "../package.json" with { type: "json" };
import sharedPkg from "../../shared/package.json" with { type: "json" };
import {
  buildPermissionMap,
  generateJavaScriptModule,
} from "../lib/rpc/rbac/extract-permissions.js";

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

// ============================================================================
// Build Tasks
// ============================================================================

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
    const { name, version, type, dependencies, imports } = pkg;

    // Remove workspace references, add published shared package as real dependency
    const workspaceDeps = ["@mapineda48/agape", "@mapineda48/agape-rpc"];
    const backendDeps = Object.fromEntries(
      Object.entries(dependencies).filter(
        ([key]) => !workspaceDeps.includes(key),
      ),
    );

    const productionPackage = {
      name,
      version,
      type,
      dependencies: {
        ...backendDeps,
        "@mapineda48/agape": sharedPkg.version,
        "@mapineda48/agape-rpc": sharedPkg.version,
      },
      scripts: {
        start: "node bin/index.js",
        cluster: "node bin/cluster.js",
      },
      imports,
    };

    await fs.outputJSON(path.join(DIST, "package.json"), productionPackage, {
      spaces: 2,
    });

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
