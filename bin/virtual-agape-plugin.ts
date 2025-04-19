import path from "node:path";
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from "fs-extra";
import { glob } from "glob";
import { Plugin, ViteDevServer } from "vite";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const service = path.resolve("svc");
const extname = path.extname(__filename);

const virtualModule = "@agape";
const axios = `${virtualModule}/axios`;


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

export function toUrl(filename: string, root = virtualModule) {
  const moduleUrl = toPosixPath(filename).replace(extname, "").replace("/index", "").replace("index", "");

  return path.posix.join(root, moduleUrl);
}

function initAgapePlugin(): Plugin {
  const virtualModuleMap: { [url: string]: string } = JSON.parse(execSync(`tsx ${__filename} --sync-load`).toString());

  virtualModuleMap["\0" + axios] = fs.readFileSync(path.resolve("lib/rpc/index.browser.js"), "utf8");

  function makeApi(file: string, viteServer: ViteDevServer) {
    // 2️⃣ Obtén la ruta relativa de `file` respecto a `root`
    const relativePath = path.relative(service, file);

    if (relativePath.startsWith('..')) {
      return;
    }

    const moduleUrl = toUrl(relativePath);
    const resolvedId = "\0" + moduleUrl;

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
      glob
        .sync("**/*" + extname, { cwd: service })
        .map(chunk => path.join(service, chunk))
        .map(file => makeApi(file, server))
    },

    resolveId(id) {
      if (id.startsWith(virtualModule)) {
        const resolved = "\0" + id;
        return resolved;
      }
    },

    load(id) {
      if (virtualModuleMap[id]) {
        return virtualModuleMap[id];
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
  glob("**/*" + extname, { cwd: service }).then(async modules => {
    const files = modules.map(chunk => path.join(service, chunk));

    const entries: string[][] = [];

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];

        const relativePath = path.relative(service, file);

        const resolvedId = "\0" + toUrl(relativePath);

        const module = await import(pathToFileURL(file).href + "?" + Date.now());

        entries.push([resolvedId, addJsData(module, relativePath)]);
      }
    } catch (error) {
      throw error;
    }

    console.log(JSON.stringify(Object.fromEntries(entries)));
  })
    .catch(error => {
      throw error;
    })

}

export default initAgapePlugin;

function addJsData(module: any, relativePath: string) {

  const publicUrl = toUrl(relativePath, "/");
  const jsData = [`import makeRcp from '${axios}'`];

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
