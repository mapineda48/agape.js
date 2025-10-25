import { promisify } from "node:util";
import { exec } from "node:child_process";
import type { Plugin, ViteDevServer } from "vite";

const execAsync = promisify(exec);

const namespace = "@agape";

const { stdout: json } = await execAsync('tsx --tsconfig tsconfig.app.json lib/rpc/virtual-module.ts');

const virtualModule: { [endpoint: string]: string } = JSON.parse(json.toString());

const vitePluginRpc: Plugin = {
    name: 'virtual-agape-plugin',
    enforce: 'pre', // Ejecuta antes que otros plugins (como Rollup)
    apply: () => true, // Aplica en modo desarrollo y build

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
};

export default vitePluginRpc;