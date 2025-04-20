import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import { glob } from "glob";

export const service = path.resolve("svc");

const __filename = fileURLToPath(import.meta.url);
const extname = path.extname(__filename);

export default async function findServices() {
    const route = express.Router();

    const chunks = findService();

    await Promise.all(chunks.map(toRpc(route)))

    return Promise.resolve(route);
}

function toRpc(route: express.Router): (svc: MatchService) => Promise<void> {
    return async ({ file, relativePath }) => {
        const module = await import(pathToFileURL(file).href);

        const moduleUrl = toPublicUrl(relativePath);

        Object
            .entries(module)
            .forEach(([exportName, fn]) => {
                if (typeof fn !== "function") {
                    return;
                }

                const endpoint = path.posix.join(
                    "/",
                    moduleUrl,
                    exportName !== "default" ? exportName : ""
                );

                route.post(endpoint, prepareRpc(fn));
            });
    };
}

function prepareRpc(fn: Function): express.RequestHandler {
    return (req, res, next) => {
        try {
            const result = fn.call(null, ...req.body);

            if (result instanceof Promise) {
                result
                    .then(payload => {
                        res.json(payload);
                    })
                    .catch(err => next(err));
            }
        } catch (error) {
            console.error(error);
            next(error);
        }
    };
}

export function toRelativePathService(file: string) {
    return path.relative(service, file);
}

export function findService() {
    return glob.sync("**/*" + extname, { cwd: service }).map((relativePath) => ({ file: path.join(service, relativePath), relativePath }))
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

export function toUrl(root: string, filename: string, ...chunks: string[]) {
    const moduleUrl = toPosixPath(filename).replace(extname, "").replace("/index", "").replace("index", "");

    return path.posix.join(root, moduleUrl, ...chunks);
}

export function toPublicUrl(filename: string, ...chunks: string[]) {
    return toUrl("/", filename, ...chunks);
}

/**
 * Types
 */
type MatchService = ReturnType<typeof findService>[number];