/**
 * Post-build script for production deployment preparation.
 *
 * This script runs after TypeScript compilation to:
 * 1. Flatten tsc output structure
 * 2. Resolve path aliases (#lib/*, #models/*, #svc/*, #shared/*)
 * 3. Copy frontend build output into backend dist
 * 4. Reorganize distribution files
 * 5. Copy static assets (SQL migrations)
 * 6. Move source maps
 * 7. Generate production package.json
 * 8. Generate permissions map
 * 9. Pre-render SSG pages
 *
 * Frontend-specific build tasks are delegated to @agape/frontend/server/build.
 *
 * @module bin/build
 */

import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "node:fs/promises";
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

/**
 * Path alias map from tsconfig.json paths.
 * Maps alias prefixes (e.g. "#lib/") to dist directory paths (e.g. "lib/").
 */
const PATH_ALIASES = Object.entries(compilerOptions.paths).map(
  ([alias, [pattern]]) => ({
    prefix: alias.replace("/*", "/"),
    target: pattern.replace("/*", "/"),
  }),
);

// ============================================================================
// Build Tasks
// ============================================================================

/**
 * Flattens the tsc output structure.
 *
 * Because rootDir covers both backend/ and shared/ (to compile shared
 * imports), tsc emits to dist/backend/ and dist/shared/. This step
 * moves everything up so dist/ has the expected flat structure.
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
      console.log(
        chalk.gray("  ✓ Removed dist/shared/ (resolved via npm in production)"),
      );
    }

    console.log(chalk.green("✓ tsc output flattened\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to flatten tsc output:"), error);
    throw error;
  }
}

/**
 * Resolves TypeScript path aliases in compiled JS files.
 *
 * Replaces #lib/*, #models/*, #svc/* imports with relative paths and .js extensions.
 * Rewrites #shared/* to use the @mapineda48/agape npm package.
 *
 * Runs AFTER flattenTscOutput so the dist structure matches the alias paths.
 */
async function resolvePathAliases(): Promise<void> {
  console.log(chalk.blue("🔗 Resolving path aliases..."));

  let filesProcessed = 0;
  let aliasesResolved = 0;

  try {
    for await (const relPath of glob("**/*.js", { cwd: DIST })) {
      const filePath = path.resolve(DIST, relPath);
      const content = await fs.readFile(filePath, "utf8");

      let modified = content;
      const fileDir = path.dirname(filePath);

      for (const { prefix, target } of PATH_ALIASES) {
        // Match import/export statements with this alias prefix
        const aliasRegex = new RegExp(
          `(from\\s+["'])${escapeRegex(prefix)}([^"']+)(["'])`,
          "g",
        );

        modified = modified.replace(
          aliasRegex,
          (_match, before, modulePath, after) => {
            // #shared/* → @mapineda48/agape/* (npm package)
            if (prefix === "#shared/") {
              const withExt = ensureJsExt(modulePath);
              aliasesResolved++;
              return `${before}@mapineda48/agape/${withExt}${after}`;
            }

            // Compute relative path from the file to the target
            const absoluteTarget = path.resolve(DIST, target, modulePath);
            let relativePath = path.relative(fileDir, absoluteTarget);

            // Ensure it starts with ./ or ../
            if (!relativePath.startsWith(".")) {
              relativePath = `./${relativePath}`;
            }

            // Normalize path separators and ensure .js extension
            relativePath = relativePath.replace(/\\/g, "/");
            relativePath = resolveModulePath(relativePath, DIST, target, modulePath);

            aliasesResolved++;
            return `${before}${relativePath}${after}`;
          },
        );
      }

      // Also fix bare relative imports missing .js extension
      // Matches: from "./foo" or from "../bar/baz" (without .js/.json extension)
      modified = modified.replace(
        /(from\s+["'])(\.\.?\/[^"']+)(["'])/g,
        (_match, before, importPath, after) => {
          // Skip if already has a file extension
          if (/\.\w+$/.test(importPath)) return _match;

          // Check if it's a directory with index.js
          const absolutePath = path.resolve(fileDir, importPath);
          if (
            fs.existsSync(absolutePath) &&
            fs.statSync(absolutePath).isDirectory()
          ) {
            aliasesResolved++;
            return `${before}${importPath}/index.js${after}`;
          }

          aliasesResolved++;
          return `${before}${importPath}.js${after}`;
        },
      );

      if (modified !== content) {
        await fs.writeFile(filePath, modified, "utf8");
        filesProcessed++;
      }
    }

    console.log(
      chalk.gray(
        `  ✓ Resolved ${aliasesResolved} aliases in ${filesProcessed} files`,
      ),
    );
    console.log(chalk.green("✓ Path aliases resolved\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to resolve path aliases:"), error);
    throw error;
  }
}

/**
 * Resolves a module path, handling both file and directory (index.js) imports.
 */
function resolveModulePath(
  relativePath: string,
  distDir: string,
  target: string,
  modulePath: string,
): string {
  const absoluteTarget = path.resolve(distDir, target, modulePath);

  // Check if it's a directory with index.js
  if (
    fs.existsSync(absoluteTarget) &&
    fs.statSync(absoluteTarget).isDirectory()
  ) {
    return ensureJsExt(`${relativePath}/index`);
  }

  return ensureJsExt(relativePath);
}

function ensureJsExt(p: string): string {
  if (p.endsWith(".js")) return p;
  return `${p}.js`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
        "@mapineda48/agape": sharedVersion,
        "@mapineda48/agape-rpc": sharedVersion,
      },
      scripts: {
        start: "node bin/index.js",
        cluster: "node bin/cluster.js",
      },
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
    await flattenTscOutput();
    await resolvePathAliases();
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
