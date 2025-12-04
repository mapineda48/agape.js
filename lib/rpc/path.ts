import { glob } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const extname = path.extname(__filename);
const pattern = "**/*" + extname;
export const cwd = path.resolve("svc");

export const svc = glob(pattern, {
  cwd,
  exclude: ["**/*.d.ts", "**/*.test.ts"],
});

/**
 * Convierte una ruta en formato Windows o POSIX a formato POSIX.
 *
 * @param {string} inputPath - La ruta de entrada, ya sea en formato POSIX o Windows.
 * @returns {string} La ruta convertida en formato POSIX.
 */
function toPosixPath(inputPath: string): string {
  // Verifica si la ruta es Windows (presencia de barras invertidas o formato de unidad)
  if (inputPath.indexOf("\\") !== -1 || /^[A-Za-z]:/.test(inputPath)) {
    // Reemplaza todas las barras invertidas por barras diagonales
    let posixPath = inputPath.replace(/\\/g, "/");
    // Convierte el prefijo de drive (por ejemplo, "C:") a formato POSIX ("/c")
    posixPath = posixPath.replace(
      /^([A-Za-z]):/,
      (_, drive) => "/" + drive.toLowerCase()
    );
    return posixPath;
  } else {
    // Si ya está en formato POSIX, se devuelve tal cual
    return inputPath;
  }
}

export function toUrl(root: string, filename: string, ...chunks: string[]) {
  const moduleUrl = toPosixPath(filename)
    .replace(extname, "")
    .replace("/index", "")
    .replace("index", "");

  return path.posix.join(root, moduleUrl, ...chunks);
}

export function toPublicUrl(filename: string, ...chunks: string[]) {
  return toUrl("/", filename, ...chunks);
}
