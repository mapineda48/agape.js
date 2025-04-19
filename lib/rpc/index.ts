import express from "express";
import { glob } from "glob";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const servicePath = "svc";
export const service = path.resolve(servicePath);

const __filename = fileURLToPath(import.meta.url);
const extname = path.extname(__filename);

export default async function findServices() {
    const route = express.Router();

    const chunks = findModulePath();

    await Promise.all(chunks.map(async chunk => {
        const file = path.join(service, chunk);
        const module = await import(pathToFileURL(file).href);

        const moduleUrl = toUrlService(chunk);

        Object
            .entries(module)
            .forEach(([exportName, fn]) => {
                if (typeof fn !== "function") {
                    return
                }

                const endpoint = path.posix.join(
                    "/",
                    moduleUrl,
                    exportName !== "default" ? exportName : ""
                );

                console.log(endpoint);

                route.post(endpoint, (req, res, next) => {
                    console.log(endpoint);
                    try {
                        const result = fn.call(null, ...req.body);

                        if (result instanceof Promise) {
                            result
                                .then(payload => {
                                    res.json(payload)
                                })
                                .catch(err => next(err))
                        }
                    } catch (error) {
                        console.error(error)
                        next(error)
                    }
                })
            });
    }))

    return Promise.resolve(route);
}

export function findModulePath() {
    return glob.sync("**/*" + extname, { cwd: service })
}

export function toUrlService(filename: string) {
    const moduleUrl = toPosixPath(filename).replace(extname, "").replace("/index", "").replace("index", "");

    return path.posix.join("/", moduleUrl);
}

/**
 * Convierte una ruta en formato Windows o POSIX a formato POSIX.
 *
 * @param {string} inputPath - La ruta de entrada, ya sea en formato POSIX o Windows.
 * @returns {string} La ruta convertida en formato POSIX.
 */
function toPosixPath(inputPath: string): string {
    // Verifica si la ruta es Windows (presencia de barras invertidas o formato de unidad)
    if (inputPath.indexOf('\\') !== -1 || /^[A-Za-z]:/.test(inputPath)) {
        // Reemplaza todas las barras invertidas por barras diagonales
        let posixPath = inputPath.replace(/\\/g, '/');
        // Convierte el prefijo de drive (por ejemplo, "C:") a formato POSIX ("/c")
        posixPath = posixPath.replace(/^([A-Za-z]):/, (_, drive) => '/' + drive.toLowerCase());
        return posixPath;
    } else {
        // Si ya está en formato POSIX, se devuelve tal cual
        return inputPath;
    }
}