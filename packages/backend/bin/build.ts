/**
 * Post-build script for production deployment preparation.
 *
 * This script runs after TypeScript compilation (with tsc-alias) and Vite build to:
 * 1. Copy frontend build output into backend dist
 * 2. Reorganize distribution files
 * 3. Copy static assets (SQL migrations, source maps)
 * 4. Generate production package.json
 * 5. Generate permissions map
 * 6. Pre-render SSG pages
 *
 * @module bin/build
 */

import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "node:fs/promises";
import chalk from "chalk";
import { name, version, type, dependencies } from "../package.json";
import { dependencies as sharedDependencies } from "../../shared/package.json";
import { compilerOptions } from "../tsconfig.json";
import {
  buildPermissionMap,
  generateJavaScriptModule,
} from "../lib/rpc/rbac/extract-permissions";

// ============================================================================
// Constants
// ============================================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "..");
const FRONTEND_ROOT = path.resolve(__dirname, "../../frontend");
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

    // dist/shared/ is kept — #shared/* resolves here via package.json imports
    console.log(chalk.green("✓ tsc output flattened\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to flatten tsc output:"), error);
    throw error;
  }
}

/**
 * Copies frontend build output into the backend dist directory.
 */
async function copyFrontendBuild(): Promise<void> {
  console.log(chalk.blue("📁 Copying frontend build output..."));

  try {
    const frontendDist = path.resolve(FRONTEND_ROOT, "dist");

    if (!fs.existsSync(frontendDist)) {
      console.log(chalk.yellow("  ⚠ Frontend dist not found, skipping"));
      return;
    }

    // Copy www (client bundle) and ssr bundle
    if (fs.existsSync(path.join(frontendDist, "www"))) {
      await fs.copy(path.join(frontendDist, "www"), path.join(DIST, "web/www"));
      console.log(chalk.gray("  ✓ Copied client bundle to dist/web/www/"));
    }

    if (fs.existsSync(path.join(frontendDist, "ssr"))) {
      await fs.copy(path.join(frontendDist, "ssr"), path.join(DIST, "web/ssr"));
      console.log(chalk.gray("  ✓ Copied SSR bundle to dist/web/ssr/"));
    }

    console.log(chalk.green("✓ Frontend build copied\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to copy frontend build:"), error);
    throw error;
  }
}

/**
 * Reorganizes compiled distribution files.
 */
async function reorganizeDistFiles(): Promise<void> {
  console.log(chalk.blue("📁 Reorganizing distribution files..."));

  try {
    const indexHtml = path.join(DIST, "web/www/index.html");
    if (fs.existsSync(indexHtml)) {
      await fs.move(indexHtml, path.join(DIST, "web/index.html"));
      console.log(chalk.gray("  ✓ Moved index.html to web root"));
    }

    // Remove vite plugin artifacts from backend dist
    await fs.remove(path.join(DIST, "lib/vite"));
    console.log(chalk.gray("  ✓ Removed build artifacts"));

    console.log(chalk.green("✓ File reorganization complete\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to reorganize files:"), error);
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
 * Reorganizes source maps for cleaner distribution structure.
 */
async function moveSourceMaps(): Promise<void> {
  console.log(chalk.blue("🗺️  Reorganizing source maps..."));

  let mapsMoved = 0;

  try {
    const wwwPath = path.join(DIST, "web/www");

    if (!fs.existsSync(wwwPath)) {
      console.log(chalk.gray("  ⓘ No www directory found, skipping"));
      console.log(chalk.green("✓ Source maps step complete\n"));
      return;
    }

    for await (const mapFile of glob("**/*.map", { cwd: wwwPath })) {
      const sourcePath = path.resolve(wwwPath, mapFile);
      const destPath = path.resolve(DIST, "web/source-map", mapFile);

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
 */
async function generateProductionPackageJson(): Promise<void> {
  console.log(chalk.blue("📝 Generating production package.json..."));

  try {
    // Merge backend + shared deps for production (shared is bundled inline)
    const backendDeps = Object.fromEntries(
      Object.entries(dependencies).filter(([key]) => key !== "@mapineda48/agape"),
    );
    const allDependencies = { ...backendDeps, ...sharedDependencies };

    const productionPackage = {
      name,
      version,
      type,
      dependencies: allDependencies,
      scripts: {
        start: "node bin/index.js",
        cluster: "node bin/cluster.js",
      },
      imports: {
        "#shared/*": "./shared/*",
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

/**
 * Pre-renders SSG pages at build time.
 */
async function preRenderSSGPages(): Promise<void> {
  console.log(chalk.blue("📄 Pre-rendering SSG pages..."));

  try {
    const ssrEntryPath = path.join(DIST, "web/ssr/entry-server.js");

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

    const template = fs.readFileSync(
      path.join(DIST, "web/index.html"),
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
      if (route.pathname.includes(":")) {
        console.log(chalk.yellow(`  ⚠ Skipping dynamic SSG route: ${route.pathname}`));
        continue;
      }

      const result = await render(route.pathname);

      if (!result) {
        console.log(chalk.yellow(`  ⚠ Render returned null for: ${route.pathname}`));
        continue;
      }

      const ssrDataScript = `<script id="__SSR_DATA__" type="application/json">${
        JSON.stringify(result.ssrData).replace(/</g, "\\u003c")
      }</script>`;

      let html = template;
      html = html.replace("<!--ssr-outlet-->", result.html);
      html = html.replace("<!--ssr-data-->", ssrDataScript);

      const outputDir = route.pathname === "/"
        ? path.join(DIST, "web/www")
        : path.join(DIST, "web/www", route.pathname.slice(1));
      const outputFile = path.join(outputDir, "index.html");

      await fs.ensureDir(outputDir);
      await fs.writeFile(outputFile, html, "utf8");

      console.log(chalk.gray(`  ✓ ${route.pathname} → ${path.relative(DIST, outputFile)}`));
      pagesRendered++;
    }

    console.log(chalk.gray(`  ✓ Pre-rendered ${pagesRendered} SSG pages`));
    console.log(chalk.green("✓ SSG pre-rendering complete\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to pre-render SSG pages:"), error);
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
    await copyFrontendBuild();
    await reorganizeDistFiles();
    await copyStaticAssets();
    await moveSourceMaps();
    await generateProductionPackageJson();
    await generatePermissions();
    await preRenderSSGPages();

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
