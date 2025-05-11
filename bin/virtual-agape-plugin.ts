import path from "node:path";
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from "node:child_process";
import fs from "fs-extra";
import type { Plugin, ViteDevServer } from "vite";
import { toUrl, toPublicUrl, findService, toRelativePathService } from "../lib/rpc/middleware";

const namespace = "@agape";
const libs = ["rpc", "access"];
const syncService = `tsx --tsconfig tsconfig.build.json ${fileURLToPath(import.meta.url)} --sync-load`;

export default function initAgapePlugin(): Plugin {
  const virtualModuleMap = initRpc();

  function makeApi(file: string, viteServer: ViteDevServer) {
    // 2️⃣ Obtén la ruta relativa de `file` respecto a `root`
    const relativePath = toRelativePathService(file);

    if (relativePath.startsWith('..')) {
      return;
    }

    const moduleUrl = toUrl(namespace, relativePath);
    const resolvedId = toVirtualModule(moduleUrl);

    if (!virtualModuleMap[resolvedId]) {
      virtualModuleMap[resolvedId] = `export default null;`;
    }

    import(pathToFileURL(file).href + "?" + Date.now())
      .then(module => {
        const mod = viteServer.moduleGraph.getModuleById(resolvedId);

        if (!mod) {
          return
        }

        virtualModuleMap[resolvedId] = addJsData(module, relativePath);

        // Invalida el módulo para que se vuelva a cargar con el nuevo contenido
        viteServer.moduleGraph.invalidateModule(mod);

        // Envía una actualización HMR para que se re-evalúe el módulo virtual
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

  return {
    name: 'virtual-agape-plugin',
    enforce: 'pre', // importante para que entre antes de Rollup
    apply: () => true, // aplica en dev y build

    configureServer(server) {
      findService().map(({ file }) => makeApi(file, server))
    },

    resolveId(id) {
      if (id.startsWith(namespace)) {
        return toVirtualModule(id);
      }

      if (id.startsWith('#utils/')) {
        return id  // lo tratamos como “resuelto”
      }
    },

    load(id) {
      if (virtualModuleMap[id]) {
        return virtualModuleMap[id];
      }

      if (id.startsWith('#utils/')) {
        return 'export {}' // código vacío, nada falla
      }
    },

    // handleHotUpdate: Hook que se ejecuta cuando hay cambios en alguno de los archivos observados.
    // Si detectamos cambios en content.txt, invalidamos el módulo virtual para forzar su recarga.
    handleHotUpdate({ file, server }) {
      makeApi(file, server);
    }
  }
}

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

function initRpc() {
  const virtualModule: IVirtualModule = JSON.parse(execSync(syncService).toString());

  for (const lib of libs) {
    const filename = path.resolve("lib", lib, "browser.js");
    const moduleUrl = toUrl(namespace, lib);

    virtualModule[toVirtualModule(moduleUrl)] = fs.readFileSync(filename, "utf8");
  }

  return virtualModule;
}

function addJsData(module: any, relativePath: string) {

  const publicUrl = toPublicUrl(relativePath);
  const jsData = [`import makeRcp from '${namespace}/rpc'`];

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

export function toVirtualModule(moduleUrl: string) {
  return "\0" + moduleUrl
}

/**
 * Types
 */
type IVirtualModule = { [url: string]: string }