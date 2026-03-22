/**
 * Post-build script for the web package.
 *
 * Runs after Vite build to reorganize dist, move source maps,
 * and generate the paths module.
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
  await generatePathsModule();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(chalk.bold.green(`✨ Web post-build completed in ${duration}s\n`));
}

main();
