/**
 * Post-build script for production deployment preparation.
 *
 * This script runs after TypeScript compilation and Vite build to:
 * 1. Reorganize distribution files
 * 2. Fix ESM import/export extensions
 * 3. Copy static assets (SQL migrations, source maps)
 * 4. Generate production package.json
 *
 * @module bin/build
 */

import fs from "fs-extra";
import path from "node:path";
import { glob } from "node:fs/promises";
import chalk from "chalk";
import { name, version, type, dependencies } from "../package.json";
import { compilerOptions } from "../tsconfig.app.json";
import {
  buildPermissionMap,
  generateJavaScriptModule,
} from "../lib/rpc/rbac/extract-permissions";

// ============================================================================
// Constants
// ============================================================================

/** Supported JavaScript file extensions in order of preference */
const SUPPORTED_EXTENSIONS = [".js", ".cjs", ".mjs"] as const;

/** Root directory of the distribution build */
const DIST_ROOT = path.resolve("dist");

/** Import path aliases from tsconfig */
const IMPORT_ALIASES = Object.fromEntries(
  Object.entries(compilerOptions.paths).map(([alias, [pattern]]) => [
    alias,
    pattern,
  ]),
);

/** Regex patterns for detecting imports and exports in compiled JavaScript */
const IMPORT_PATTERNS = {
  /** Matches: import ... from '...' */
  importFrom: /(import\s+[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]/g,
  /** Matches: export ... from '...' */
  exportFrom: /(export\s+[^'"\n]+?\s+from\s+)['"]([^'"]+)['"]/g,
  /** Matches: import('...') */
  dynamicImport: /(import\()\s*['"]([^'"]+)['"](s*\))/g,
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/** Represents a resolved import path with extension */
type ResolvedPath = string | null;

/** Module specifier from import/export statement */
type ModuleSpecifier = string;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resolves a module specifier to an actual file path with extension.
 *
 * Handles three types of specifiers:
 * 1. Relative/absolute paths: "./module" or "/absolute/path"
 * 2. Import aliases with wildcards: "#utils/helper"
 * 3. Current directory: "."
 *
 * @param spec - The module specifier to resolve (e.g., "./utils", "#utils/helper")
 * @param basedir - The directory from which to resolve relative paths
 * @returns The resolved path with extension, or null if not found
 *
 * @example
 * resolveModuleSpecifier("./utils", "/dist/lib") // => "./utils.js"
 * resolveModuleSpecifier("#utils/helper", "/dist/lib") // => "#utils/helper.js"
 * resolveModuleSpecifier(".", "/dist/lib") // => "./index.js"
 */
function resolveModuleSpecifier(
  spec: ModuleSpecifier,
  basedir: string,
): ResolvedPath {
  // Handle current directory reference
  if (spec === ".") {
    const base = path.resolve(basedir, spec);
    for (const ext of SUPPORTED_EXTENSIONS) {
      const indexPath = path.join(base, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return `./index${ext}`;
      }
    }
    return null;
  }

  // Handle relative and absolute paths
  if (spec.startsWith(".") || spec.startsWith("/")) {
    return resolveRelativePath(spec, basedir);
  }

  // Handle import aliases
  return resolveAliasPath(spec);
}

/**
 * Resolves a relative or absolute file path to include the correct extension.
 *
 * Attempts to find the file with supported extensions (.js, .cjs, .mjs) or
 * as an index file within a directory.
 *
 * @param spec - The relative or absolute path specifier
 * @param basedir - The base directory for resolution
 * @returns The path with extension, or null if not found
 */
function resolveRelativePath(spec: string, basedir: string): ResolvedPath {
  const base = path.resolve(basedir, spec);

  // Try direct file match with extensions
  for (const ext of SUPPORTED_EXTENSIONS) {
    if (fs.existsSync(`${base}${ext}`)) {
      return `${spec}${ext}`;
    }
  }

  // Try index file within directory
  for (const ext of SUPPORTED_EXTENSIONS) {
    const indexPath = path.join(base, `index${ext}`);
    if (fs.existsSync(indexPath)) {
      return `${spec}/index${ext}`;
    }
  }

  return null;
}

/**
 * Resolves import aliases (e.g., "#utils/helper") to actual paths with extensions.
 *
 * Supports wildcard aliases defined in tsconfig paths, such as:
 * - "#utils/*": "./lib/utils/*.ts"
 *
 * @param spec - The aliased module specifier
 * @returns The resolved path with extension, or null if not found
 */
function resolveAliasPath(spec: ModuleSpecifier): ResolvedPath {
  for (const [aliasPattern, targetPattern] of Object.entries(IMPORT_ALIASES)) {
    // Only handle wildcard aliases (e.g., "#utils/*")
    if (!aliasPattern.endsWith("/*") || !targetPattern.endsWith("/*")) {
      continue;
    }

    const aliasPrefix = aliasPattern.replace("/*", "");
    const targetPrefix = targetPattern.replace("/*", "");

    // Check if specifier matches this alias
    if (spec !== aliasPrefix && !spec.startsWith(`${aliasPrefix}/`)) {
      continue;
    }

    // Extract the suffix after the alias prefix
    const suffix = spec.slice(aliasPrefix.length);
    const relPath = path.join(targetPrefix, suffix);

    // Try to find file with supported extensions
    for (const ext of SUPPORTED_EXTENSIONS) {
      const fullPath = path.resolve(DIST_ROOT, `${relPath}${ext}`);
      if (fs.existsSync(fullPath)) {
        return `${spec}${ext}`;
      }
    }

    // Try to find index file
    for (const ext of SUPPORTED_EXTENSIONS) {
      const indexPath = path.resolve(DIST_ROOT, relPath, `index${ext}`);
      if (fs.existsSync(indexPath)) {
        return `${spec}/index${ext}`;
      }
    }
  }

  return null;
}

/**
 * Normalizes an import path entry from package.json imports field.
 *
 * Ensures paths:
 * - Start with "./"
 * - Use .js extension instead of .ts
 *
 * @param entry - Tuple of [alias, pattern]
 * @returns Normalized tuple ready for package.json
 *
 * @example
 * normalizeImportPath(["#utils/*", "lib/utils/*.ts"])
 * // => ["#utils/*", "./lib/utils/*.js"]
 */
function normalizeImportPath([key, pattern]: [string, string]): [
  string,
  string,
] {
  let normalizedPattern = pattern;

  // Ensure pattern starts with "./"
  if (!normalizedPattern.startsWith("./")) {
    normalizedPattern = `./${normalizedPattern}`;
  }

  // Replace .ts extension with .js
  if (normalizedPattern.endsWith(".ts")) {
    normalizedPattern = normalizedPattern.replace(".ts", ".js");
  }

  return [key, normalizedPattern];
}

// ============================================================================
// Build Tasks
// ============================================================================

/**
 * Reorganizes compiled distribution files.
 *
 * Moves the main HTML file to the correct location and removes
 * unnecessary build artifacts (vite plugins).
 */
async function reorganizeDistFiles(): Promise<void> {
  console.log(chalk.blue("📁 Reorganizing distribution files..."));

  try {
    await fs.move("dist/web/www/index.html", "dist/web/index.html");
    console.log(chalk.gray("  ✓ Moved index.html to web root"));

    await fs.remove("dist/lib/rpc/vite-plugin.js");
    await fs.remove("dist/lib/rpc/virtual-module.js");
    console.log(chalk.gray("  ✓ Removed build artifacts"));

    console.log(chalk.green("✓ File reorganization complete\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to reorganize files:"), error);
    throw error;
  }
}

/**
 * Fixes import/export statements in compiled JavaScript files.
 *
 * Node.js ESM requires explicit file extensions in import statements.
 * This function:
 * 1. Scans all .js files in dist/
 * 2. Detects import/export statements without extensions
 * 3. Resolves the correct extension (.js, .cjs, .mjs)
 * 4. Rewrites the import/export with the correct extension
 *
 * Handles:
 * - Static imports: import x from './module'
 * - Static exports: export { x } from './module'
 * - Dynamic imports: import('./module')
 * - Import aliases: import x from '#utils/helper'
 */
async function fixImportExtensions(): Promise<void> {
  console.log(
    chalk.blue("🔧 Fixing import extensions for ESM compatibility..."),
  );

  let filesProcessed = 0;
  let importsFixed = 0;

  try {
    for await (const file of glob("**/*.js", { cwd: DIST_ROOT })) {
      const filename = path.join(DIST_ROOT, file);
      let code = await fs.readFile(filename, "utf8");
      const dir = path.dirname(filename);
      let fileModified = false;

      // Fix: import ... from '...'
      code = code.replace(IMPORT_PATTERNS.importFrom, (all, prefix, spec) => {
        const resolved = resolveModuleSpecifier(spec, dir);
        if (resolved) {
          importsFixed++;
          fileModified = true;
          return `${prefix}'${resolved.replace(/\\/g, "/")}'`;
        }
        return all;
      });

      // Fix: export ... from '...'
      code = code.replace(IMPORT_PATTERNS.exportFrom, (all, prefix, spec) => {
        const resolved = resolveModuleSpecifier(spec, dir);
        if (resolved) {
          importsFixed++;
          fileModified = true;
          return `${prefix}'${resolved.replace(/\\/g, "/")}'`;
        }
        return all;
      });

      // Fix: import('...')
      code = code.replace(
        IMPORT_PATTERNS.dynamicImport,
        (all, prefix, spec, suffix) => {
          const resolved = resolveModuleSpecifier(spec, dir);
          if (resolved) {
            importsFixed++;
            fileModified = true;
            return `${prefix}'${resolved.replace(/\\/g, "/")}'${suffix}`;
          }
          return all;
        },
      );

      if (fileModified) {
        await fs.writeFile(filename, code, "utf8");
      }
      filesProcessed++;
    }

    console.log(chalk.gray(`  ✓ Processed ${filesProcessed} JavaScript files`));
    console.log(
      chalk.gray(`  ✓ Fixed ${importsFixed} import/export statements`),
    );
    console.log(chalk.green("✓ Import extension fixes complete\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to fix import extensions:"), error);
    throw error;
  }
}

/**
 * Copies static assets required for production.
 *
 * Copies SQL migration scripts from source to distribution directory
 * for runtime database initialization.
 */
async function copyStaticAssets(): Promise<void> {
  console.log(chalk.blue("📦 Copying static assets..."));

  try {
    const sourcePath = "lib/db/migrations/scripts";
    const destPath = "dist/lib/db/migrations/scripts";

    await fs.copy(sourcePath, destPath);
    console.log(chalk.gray("  ✓ Copied SQL migration scripts"));
    console.log(chalk.green("✓ Static assets copied\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to copy static assets:"), error);
    throw error;
  }
}

/**
 * Reorganizes source maps for cleaner distribution structure.
 *
 * Moves source map files from www/ to a dedicated source-map/ directory
 * to keep the web root clean.
 */
async function moveSourceMaps(): Promise<void> {
  console.log(chalk.blue("🗺️  Reorganizing source maps..."));

  let mapsMoved = 0;

  try {
    const wwwPath = path.resolve("dist/web/www");

    for await (const mapFile of glob("**/*.map", { cwd: wwwPath })) {
      const sourcePath = path.resolve(wwwPath, mapFile);
      const destPath = path.resolve("dist/web/source-map", mapFile);

      await fs.move(sourcePath, destPath);
      mapsMoved++;
    }

    console.log(chalk.gray(`  ✓ Moved ${mapsMoved} source map files`));
    console.log(chalk.green("✓ Source maps reorganized\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to move source maps:"), error);
    throw error;
  }
}

/**
 * Generates production package.json with minimal configuration.
 *
 * Creates a streamlined package.json for the dist/ directory containing:
 * - Core metadata (name, version, type)
 * - Production dependencies only
 * - Start scripts for single and cluster modes
 * - Normalized import aliases
 */
async function generateProductionPackageJson(): Promise<void> {
  console.log(chalk.blue("📝 Generating production package.json..."));

  try {
    const productionPackage = {
      name,
      version,
      type,
      dependencies,
      scripts: {
        start: "node bin/index.js",
        cluster: "node bin/cluster.js",
      },
      imports: Object.fromEntries(
        Object.entries(IMPORT_ALIASES).map(normalizeImportPath),
      ),
    };

    await fs.outputJSON("dist/package.json", productionPackage, { spaces: 2 });

    console.log(chalk.gray("  ✓ Created dist/package.json"));
    console.log(chalk.green("✓ Production package.json generated\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to generate package.json:"), error);
    throw error;
  }
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Main build script execution.
 *
 * Runs all post-build tasks in sequence:
 * 1. Reorganize distribution files
 * 2. Fix import extensions
 * 3. Copy static assets
 * 4. Move source maps
 * 5. Generate production package.json
 */

/**
 * Generates the RPC permissions map for production.
 *
 * Scans service files for permissions and generates a JavaScript module
 * in the distribution folder, overwriting the placeholder generated by tsc.
 */
async function generatePermissions(): Promise<void> {
  console.log(chalk.blue("🔐 Generating production permissions map..."));

  try {
    const permissions = await buildPermissionMap();
    const jsCode = generateJavaScriptModule(permissions);

    const outputPath = path.resolve("dist/lib/rpc/permissions.generated.js");
    await fs.writeFile(outputPath, jsCode, "utf8");

    console.log(chalk.gray(`  ✓ Wrote permissions to ${outputPath}`));
    console.log(chalk.green("✓ Permissions map generated\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to generate permissions:"), error);
    throw error;
  }
}

/**
 * Main build script execution.
 *
 * Runs all post-build tasks in sequence:
 * 1. Reorganize distribution files
 * 2. Fix import extensions
 * 3. Copy static assets
 * 4. Move source maps
 * 5. Generate production package.json
 * 6. Generate permissions map
 */
async function main(): Promise<void> {
  console.log(chalk.bold.cyan("\n🚀 Running post-build tasks...\n"));

  const startTime = Date.now();

  try {
    await runTask(reorganizeDistFiles);
    await runTask(fixImportExtensions);
    await runTask(copyStaticAssets);
    await runTask(moveSourceMaps);
    await runTask(generateProductionPackageJson);
    await runTask(generatePermissions);

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

async function runTask(task: () => Promise<void>) {
  await task();
}

// Execute main function
main();
