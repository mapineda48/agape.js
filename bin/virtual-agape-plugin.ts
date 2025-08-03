/**
 * Vite Plugin: virtual-agape-plugin
 * ---------------------------------
 * Este plugin permite la creación de módulos virtuales para servicios RPC en proyectos Vite.
 * Genera módulos virtuales dinámicamente a partir de archivos de servicio, facilitando el acceso
 * a endpoints RPC desde el frontend. Además, soporta recarga en caliente (HMR) cuando los servicios cambian.
 *
 * Principales responsabilidades:
 * - Resolver y cargar módulos virtuales bajo el namespace "@agape".
 * - Generar código de cliente RPC para cada servicio detectado.
 * - Invalida y actualiza los módulos virtuales cuando los archivos de servicio cambian.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from "node:child_process";
import fs from "fs-extra";
import type { Plugin, ViteDevServer } from "vite";
import { toUrl, toPublicUrl, findService, toRelativePathService } from "../lib/rpc/services";

const namespace = "@agape";
// Comando para cargar los servicios de forma síncrona (usado en initRpc)
const syncService = `tsx --tsconfig tsconfig.backend.json ${fileURLToPath(import.meta.url)} --sync-load`;

/**
 * Inicializa el plugin de Agape para Vite.
 */
export default function initAgapePlugin(): Plugin {
    // Mapa de módulos virtuales: { [id]: código JS }
    const virtualModuleMap = initRpc();

    return {
        name: 'virtual-agape-plugin',
        enforce: 'pre', // Ejecuta antes que otros plugins (como Rollup)
        apply: () => true, // Aplica en modo desarrollo y build

        /**
         * Hook para configurar el servidor de desarrollo.
         * Genera los módulos virtuales para cada servicio detectado.
         */
        configureServer(server) {
            findService().map(({ file }) => makeApi(virtualModuleMap, file, server))
        },

        /**
         * Hook para resolver IDs de módulos.
         * - Los que empiezan por "@agape" se resuelven como módulos virtuales.
         * - Los que empiezan por "#utils/" se consideran ya resueltos.
         */
        resolveId(id) {
            if (id.startsWith(namespace)) {
                return toVirtualModule(id);
            }
        },

        /**
         * Hook para cargar el código de los módulos virtuales.
         * - Si existe en el mapa, retorna el código generado.
         * - Para "#utils/", retorna un módulo vacío.
         */
        load(id) {
            if (virtualModuleMap[id]) {
                return virtualModuleMap[id];
            }
        },

        /**
         * Hook para recarga en caliente (HMR).
         * Si un archivo de servicio cambia, regenera el módulo virtual y lo invalida.
         */
        handleHotUpdate({ file, server }) {
            makeApi(virtualModuleMap, file, server);
        }
    }
}

/**
 * Genera el código JS para el cliente RPC de un servicio y lo actualiza en el mapa de módulos virtuales.
 * Si el módulo cambia, lo invalida y envía una actualización HMR.
 */
function makeApi(virtualModuleMap: IVirtualModule, file: string, viteServer: ViteDevServer) {
    // Obtiene la ruta relativa del servicio
    const relativePath = toRelativePathService(file);

    if (relativePath.startsWith('..')) {
        return;
    }

    const moduleUrl = toUrl(namespace, relativePath);
    const resolvedId = toVirtualModule(moduleUrl);

    // Inicializa el módulo virtual si no existe
    if (!virtualModuleMap[resolvedId]) {
        virtualModuleMap[resolvedId] = `export default null;`;
    }

    // Importa dinámicamente el servicio y genera el código JS
    import(pathToFileURL(file).href + "?" + Date.now())
        .then(module => {
            const mod = viteServer.moduleGraph.getModuleById(resolvedId);

            if (!mod) {
                return
            }

            virtualModuleMap[resolvedId] = addJsData(module, relativePath);

            // Invalida el módulo para recargarlo con el nuevo contenido
            viteServer.moduleGraph.invalidateModule(mod);

            // Envía actualización HMR
            viteServer.ws.send({
                type: 'update',
                updates: [
                    {
                        acceptedPath: moduleUrl,
                        path: moduleUrl,
                        timestamp: Date.now(),
                        type: 'js-update',
                    },
                ],
            });
        })
        .catch(() => { });
}

/**
 * Inicializa el mapa de módulos virtuales cargando todos los servicios disponibles.
 * También agrega el módulo de acceso.
 */
function initRpc() {
    const virtualModule: IVirtualModule = JSON.parse(execSync(syncService).toString());

    virtualModule[toVirtualModule("@agape/access")] = fs.readFileSync("lib/access/browser.js", "utf8");
    
    return virtualModule;
}

/**
 * Genera el código JS para el cliente RPC de un servicio.
 * Exporta funciones que llaman a makeRcp con la URL pública del servicio.
 */
function addJsData(module: any, relativePath: string) {
    const publicUrl = toPublicUrl(relativePath);
    const jsData = ['import makeRcp from "@rpc/client";'];

    Object.entries(module)
        .filter(([, value]) => typeof value === "function")
        .forEach(([exportName]) => {
            if (exportName === "default") {
                jsData.push(`export default makeRcp("${publicUrl}");`);
                return;
            }
            const exportUrl = path.posix.join(publicUrl, exportName);
            jsData.push(`export const ${exportName} = makeRcp("${exportUrl}");`);
        });

    return jsData.join("\n")
}

/**
 * Convierte una URL de módulo en un ID de módulo virtual para Vite.
 */
export function toVirtualModule(moduleUrl: string) {
    return "\0" + moduleUrl
}

/**
 * Si el proceso se ejecuta con "--sync-load", imprime el mapa de módulos virtuales en JSON.
 * Usado para inicialización síncrona.
 */
if (process.argv.includes("--sync-load")) {
    Promise.all(findService().map(async ({ file, relativePath }) => {
        const moduleUrl = toUrl(namespace, relativePath);
        const resolvedId = toVirtualModule(moduleUrl);

        const module = await import(pathToFileURL(file).href);

        return [resolvedId, addJsData(module, relativePath)]
    }))
        .then(entries => {
            console.log(JSON.stringify(Object.fromEntries(entries)));
        })
        .catch(error => {
            throw error;
        })
}

/**
 * Tipos
 */
type IVirtualModule = { [url: string]: string }