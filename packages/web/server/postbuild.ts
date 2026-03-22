/**
 * Post-build script for the web package.
 *
 * Runs after Vite build to reorganize dist, move source maps,
 * pre-render SSG pages, and generate the paths module.
 */

import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "node:fs/promises";
import chalk from "chalk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");

async function reorganizeDistFiles(): Promise<void> {
  console.log(chalk.blue("📁 Reorganizing distribution files..."));

  const indexHtml = path.join(DIST, "www/index.html");
  if (fs.existsSync(indexHtml)) {
    await fs.move(indexHtml, path.join(DIST, "index.html"), { overwrite: true });
    console.log(chalk.gray("  ✓ Moved index.html to dist root"));
  }

  console.log(chalk.green("✓ File reorganization complete\n"));
}

async function moveSourceMaps(): Promise<void> {
  console.log(chalk.blue("🗺️  Reorganizing source maps..."));

  const wwwPath = path.join(DIST, "www");
  if (!fs.existsSync(wwwPath)) {
    console.log(chalk.gray("  ⓘ No www directory found, skipping"));
    return;
  }

  // Clean previous source maps
  await fs.remove(path.join(DIST, "source-map"));

  let mapsMoved = 0;
  for await (const mapFile of glob("**/*.map", { cwd: wwwPath })) {
    await fs.move(
      path.resolve(wwwPath, mapFile),
      path.resolve(DIST, "source-map", mapFile),
    );
    mapsMoved++;
  }

  console.log(chalk.gray(`  ✓ Moved ${mapsMoved} source map files`));
  console.log(chalk.green("✓ Source maps reorganized\n"));
}

async function preRenderSSGPages(): Promise<void> {
  console.log(chalk.blue("📄 Pre-rendering SSG pages..."));

  const ssrEntryPath = path.join(DIST, "ssr/entry-server.js");
  if (!fs.existsSync(ssrEntryPath)) {
    console.log(chalk.gray("  ⓘ No SSR bundle found, skipping"));
    return;
  }

  const entryModule = await import(ssrEntryPath);
  const { render, getSSRRoutes } = entryModule;

  if (!getSSRRoutes || !render) {
    console.log(chalk.gray("  ⓘ SSR entry missing render/getSSRRoutes, skipping"));
    return;
  }

  const template = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");
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

    const outputDir =
      route.pathname === "/"
        ? path.join(DIST, "www")
        : path.join(DIST, "www", route.pathname.slice(1));
    const outputFile = path.join(outputDir, "index.html");

    await fs.ensureDir(outputDir);
    await fs.writeFile(outputFile, html, "utf8");

    console.log(chalk.gray(`  ✓ ${route.pathname} → ${path.relative(DIST, outputFile)}`));
    pagesRendered++;
  }

  console.log(chalk.gray(`  ✓ Pre-rendered ${pagesRendered} SSG pages`));
  console.log(chalk.green("✓ SSG pre-rendering complete\n"));
}

async function generatePathsModule(): Promise<void> {
  console.log(chalk.blue("📦 Generating paths module..."));

  const code = [
    'import { dirname, join } from "node:path";',
    'import { fileURLToPath } from "node:url";',
    "const __dirname = dirname(fileURLToPath(import.meta.url));",
    "export const distRoot = __dirname;",
    'export const wwwRoot = join(__dirname, "www");',
    'export const ssrRoot = join(__dirname, "ssr");',
    'export const indexHtml = join(__dirname, "index.html");',
    "",
  ].join("\n");

  await fs.writeFile(path.join(DIST, "paths.js"), code);

  // Generate type declarations
  const dts = [
    "export declare const distRoot: string;",
    "export declare const wwwRoot: string;",
    "export declare const ssrRoot: string;",
    "export declare const indexHtml: string;",
    "",
  ].join("\n");

  await fs.writeFile(path.join(DIST, "paths.d.ts"), dts);
  console.log(chalk.gray("  ✓ Generated dist/paths.js + paths.d.ts"));
  console.log(chalk.green("✓ Paths module generated\n"));
}

async function main(): Promise<void> {
  console.log(chalk.bold.cyan("\n🚀 Running web post-build tasks...\n"));
  const startTime = Date.now();

  await reorganizeDistFiles();
  await moveSourceMaps();
  await preRenderSSGPages();
  await generatePathsModule();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(chalk.bold.green(`✨ Web post-build completed in ${duration}s\n`));
}

main();
