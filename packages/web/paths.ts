import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const distDir = path.join(__dirname, "dist");
export const indexHtml = path.join(distDir, "index.html");
