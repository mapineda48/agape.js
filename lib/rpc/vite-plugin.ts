import { execSync } from "node:child_process";
import type { Plugin } from "vite";

const namespace = "@agape";

const json = execSync('tsx --tsconfig tsconfig.app.json lib/rpc/virtual-module.ts');

const virtualModule: { [endpoint: string]: string } = JSON.parse(json.toString());

const vitePluginRpc: Plugin = {
    name: 'virtual-agape-plugin',
    enforce: 'pre', // Ejecuta antes que otros plugins (como Rollup)
    apply: () => true, // Aplica en modo desarrollo y build

    /**
     * Hook para configurar el servidor de desarrollo.
     * Genera los módulos virtuales para cada servicio detectado.
     */
    // configureServer(server) {
    //     findService().map(({ file }) => makeApi(virtualModuleMap, file, server))
    // },

    /**
     * Hook para resolver IDs de módulos.
     * - Los que empiezan por "@agape" se resuelven como módulos virtuales.
     */
    resolveId(id) {
        if (id.startsWith(namespace)) {
            return "\0" + id;
        }
    },

    /**
     * Hook para cargar el código de los módulos virtuales.
     * - Si existe en el mapa, retorna el código generado.
     * - Para "#utils/", retorna un módulo vacío.
     */
    load(id) {
        if (virtualModule[id]) {
            return virtualModule[id];
        }
    },

    /**
     * Hook para recarga en caliente (HMR).
     * Si un archivo de servicio cambia, regenera el módulo virtual y lo invalida.
     */
    // handleHotUpdate({ file, server }) {
    //     console.log(file);
    //     //   makeApi(virtualModuleMap, file, server);
    // }
};

export default vitePluginRpc;