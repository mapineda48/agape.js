import path from "node:path";
import { fileURLToPath } from "node:url";
import { createVitePlugin } from "@mapineda48/agape-rpc/vite/plugin";
import type { Plugin } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const servicesDir = path.join(__dirname, "services");

const NAMESPACE = "@mapineda48/agape-core/services";
const VIRTUAL_NAMESPACE = "#services";

export function agapeCoreRpc(): Plugin {
  const plugin = createVitePlugin(servicesDir);

  return {
    ...plugin,
    name: "agape-core-rpc",

    resolveId(id) {
      if (id.startsWith(NAMESPACE)) {
        const subpath = id.slice(NAMESPACE.length).replace(/\/index$/, "/");
        const virtualId = VIRTUAL_NAMESPACE + subpath;
        return (plugin.resolveId as Function).call(this, virtualId);
      }
    },
  };
}

export default agapeCoreRpc;
