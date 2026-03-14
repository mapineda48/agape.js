/**
 * Post-build script for production deployment preparation.
 *
 * This script runs after TypeScript compilation (with tsc-alias) and Vite build to:
 * 1. Reorganize distribution files
 * 2. Copy static assets (SQL migrations, source maps)
 * 3. Generate production package.json
 *
 * Note: ESM import extensions and path alias resolution are handled by
 * TypeScript's rewriteRelativeImportExtensions and tsc-alias respectively,
 * both running during the prebuild step.
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

/** Import path aliases from tsconfig (used for production package.json generation) */
const IMPORT_ALIASES = Object.fromEntries(
  Object.entries(compilerOptions.paths).map(([alias, [pattern]]) => [
    alias,
    pattern,
  ]),
);

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
 * Pre-renders SSG pages at build time.
 *
 * Imports the SSR entry-server bundle, finds all SSG routes,
 * renders each one to a static HTML file, and writes it to
 * dist/web/www/ so Express serves it as a static asset.
 */
async function preRenderSSGPages(): Promise<void> {
  console.log(chalk.blue("📄 Pre-rendering SSG pages..."));

  try {
    const ssrEntryPath = path.resolve("dist/web/ssr/entry-server.js");

    if (!fs.existsSync(ssrEntryPath)) {
      console.log(chalk.gray("  ⓘ No SSR bundle found, skipping SSG pre-rendering"));
      return;
    }

    const entryModule = await import(ssrEntryPath);
    const { render, getSSRRoutes } = entryModule;

    if (!getSSRRoutes || !render) {
      console.log(chalk.gray("  ⓘ SSR entry missing render/getSSRRoutes exports, skipping"));
      return;
    }

    // Read the production HTML template
    const template = fs.readFileSync(
      path.resolve("dist/web/index.html"),
      "utf-8",
    );

    const routes = await getSSRRoutes();
    const ssgRoutes = routes.filter((r: { rendering: string }) => r.rendering === "ssg");

    if (ssgRoutes.length === 0) {
      console.log(chalk.gray("  ⓘ No SSG routes found"));
      console.log(chalk.green("✓ SSG pre-rendering complete\n"));
      return;
    }

    let pagesRendered = 0;

    for (const route of ssgRoutes) {
      // Skip dynamic routes (contain :param) - can't pre-render without known params
      if (route.pathname.includes(":")) {
        console.log(chalk.yellow(`  ⚠ Skipping dynamic SSG route: ${route.pathname}`));
        continue;
      }

      const result = await render(route.pathname);

      if (!result) {
        console.log(chalk.yellow(`  ⚠ Render returned null for: ${route.pathname}`));
        continue;
      }

      // Build the SSR data script tag
      const ssrDataScript = `<script id="__SSR_DATA__" type="application/json">${
        JSON.stringify(result.ssrData).replace(/</g, "\\u003c")
      }</script>`;

      // Inject into template
      let html = template;
      html = html.replace("<!--ssr-outlet-->", result.html);
      html = html.replace("<!--ssr-data-->", ssrDataScript);

      // Write static HTML file: /about → dist/web/www/about/index.html
      const outputDir = route.pathname === "/"
        ? path.resolve("dist/web/www")
        : path.resolve("dist/web/www", route.pathname.slice(1));
      const outputFile = path.join(outputDir, "index.html");

      await fs.ensureDir(outputDir);
      await fs.writeFile(outputFile, html, "utf8");

      console.log(chalk.gray(`  ✓ ${route.pathname} → ${path.relative("dist", outputFile)}`));
      pagesRendered++;
    }

    console.log(chalk.gray(`  ✓ Pre-rendered ${pagesRendered} SSG pages`));
    console.log(chalk.green("✓ SSG pre-rendering complete\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to pre-render SSG pages:"), error);
    throw error;
  }
}

/**
 * Main build script execution.
 *
 * Runs all post-build tasks in sequence:
 * 1. Reorganize distribution files
 * 2. Copy static assets
 * 3. Move source maps
 * 4. Generate production package.json
 * 5. Generate permissions map
 * 6. Pre-render SSG pages
 */
async function main(): Promise<void> {
  console.log(chalk.bold.cyan("\n🚀 Running post-build tasks...\n"));

  const startTime = Date.now();

  try {
    await runTask(reorganizeDistFiles);
    await runTask(copyStaticAssets);
    await runTask(moveSourceMaps);
    await runTask(generateProductionPackageJson);
    await runTask(generatePermissions);
    await runTask(preRenderSSGPages);

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
