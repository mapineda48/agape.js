import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In development, __dirname is the package root, assets are in dist/
// When published, __dirname is dist/ itself (paths.js is compiled there)
const hasIndex = fs.existsSync(path.join(__dirname, "index.html"));
export const distDir = hasIndex ? __dirname : path.join(__dirname, "dist");
export const indexHtml = path.join(distDir, "index.html");
