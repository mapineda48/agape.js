/**
 * Frontend post-build tasks.
 *
 * These functions handle copying and reorganizing the frontend Vite build
 * output into the backend's production dist directory.
 *
 * @module frontend/server/build
 */

import fs from "fs-extra";
import path from "node:path";
import { glob } from "node:fs/promises";
import chalk from "chalk";
import { frontendPkgRoot } from "./index.ts";

/**
 * Copies frontend build output into the backend dist directory.
 */
export async function copyFrontendBuild(backendDist: string): Promise<void> {
  console.log(chalk.blue("📁 Copying frontend build output..."));

  try {
    const frontendDist = path.resolve(frontendPkgRoot, "dist");

    if (!fs.existsSync(frontendDist)) {
      console.log(chalk.yellow("  ⚠ Frontend dist not found, skipping"));
      return;
    }

    // Copy www (client bundle) and ssr bundle
    if (fs.existsSync(path.join(frontendDist, "www"))) {
      await fs.copy(
        path.join(frontendDist, "www"),
        path.join(backendDist, "web/www"),
      );
      console.log(chalk.gray("  ✓ Copied client bundle to dist/web/www/"));
    }

    if (fs.existsSync(path.join(frontendDist, "ssr"))) {
      await fs.copy(
        path.join(frontendDist, "ssr"),
        path.join(backendDist, "web/ssr"),
      );
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
export async function reorganizeDistFiles(backendDist: string): Promise<void> {
  console.log(chalk.blue("📁 Reorganizing distribution files..."));

  try {
    const indexHtml = path.join(backendDist, "web/www/index.html");
    if (fs.existsSync(indexHtml)) {
      await fs.move(indexHtml, path.join(backendDist, "web/index.html"));
      console.log(chalk.gray("  ✓ Moved index.html to web root"));
    }

    // Remove vite plugin artifacts from backend dist
    await fs.remove(path.join(backendDist, "lib/vite"));
    console.log(chalk.gray("  ✓ Removed build artifacts"));

    console.log(chalk.green("✓ File reorganization complete\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to reorganize files:"), error);
    throw error;
  }
}

/**
 * Reorganizes source maps for cleaner distribution structure.
 */
export async function moveSourceMaps(backendDist: string): Promise<void> {
  console.log(chalk.blue("🗺️  Reorganizing source maps..."));

  let mapsMoved = 0;

  try {
    const wwwPath = path.join(backendDist, "web/www");

    if (!fs.existsSync(wwwPath)) {
      console.log(chalk.gray("  ⓘ No www directory found, skipping"));
      console.log(chalk.green("✓ Source maps step complete\n"));
      return;
    }

    for await (const mapFile of glob("**/*.map", { cwd: wwwPath })) {
      const sourcePath = path.resolve(wwwPath, mapFile);
      const destPath = path.resolve(backendDist, "web/source-map", mapFile);

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
 * Pre-renders SSG pages at build time.
 */
export async function preRenderSSGPages(backendDist: string): Promise<void> {
  console.log(chalk.blue("📄 Pre-rendering SSG pages..."));

  try {
    const ssrEntryPath = path.join(backendDist, "web/ssr/entry-server.js");

    if (!fs.existsSync(ssrEntryPath)) {
      console.log(
        chalk.gray("  ⓘ No SSR bundle found, skipping SSG pre-rendering"),
      );
      return;
    }

    const entryModule = await import(ssrEntryPath);
    const { render, getSSRRoutes } = entryModule;

    if (!getSSRRoutes || !render) {
      console.log(
        chalk.gray(
          "  ⓘ SSR entry missing render/getSSRRoutes exports, skipping",
        ),
      );
      return;
    }

    const template = fs.readFileSync(
      path.join(backendDist, "web/index.html"),
      "utf-8",
    );

    const routes = await getSSRRoutes();
    const ssgRoutes = routes.filter(
      (r: { rendering: string }) => r.rendering === "ssg",
    );

    if (ssgRoutes.length === 0) {
      console.log(chalk.gray("  ⓘ No SSG routes found"));
      console.log(chalk.green("✓ SSG pre-rendering complete\n"));
      return;
    }

    let pagesRendered = 0;

    for (const route of ssgRoutes) {
      if (route.pathname.includes(":")) {
        console.log(
          chalk.yellow(`  ⚠ Skipping dynamic SSG route: ${route.pathname}`),
        );
        continue;
      }

      const result = await render(route.pathname);

      if (!result) {
        console.log(
          chalk.yellow(`  ⚠ Render returned null for: ${route.pathname}`),
        );
        continue;
      }

      const ssrDataScript = `<script id="__SSR_DATA__" type="application/json">${
        JSON.stringify(result.ssrData).replace(/</g, "\\u003c")
      }</script>`;

      let html = template;
      html = html.replace("<!--ssr-outlet-->", result.html);
      html = html.replace("<!--ssr-data-->", ssrDataScript);

      const outputDir =
        route.pathname === "/"
          ? path.join(backendDist, "web/www")
          : path.join(backendDist, "web/www", route.pathname.slice(1));
      const outputFile = path.join(outputDir, "index.html");

      await fs.ensureDir(outputDir);
      await fs.writeFile(outputFile, html, "utf8");

      console.log(
        chalk.gray(
          `  ✓ ${route.pathname} → ${path.relative(backendDist, outputFile)}`,
        ),
      );
      pagesRendered++;
    }

    console.log(chalk.gray(`  ✓ Pre-rendered ${pagesRendered} SSG pages`));
    console.log(chalk.green("✓ SSG pre-rendering complete\n"));
  } catch (error) {
    console.error(chalk.red("✗ Failed to pre-render SSG pages:"), error);
    throw error;
  }
}
