import path from "node:path";
import { fileURLToPath } from "node:url";
import { initRpc, type RpcServerOptions } from "@mapineda48/agape-rpc/server/index";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const servicesDir = path.join(__dirname, "services");

export async function createRpc(options: RpcServerOptions) {
  return initRpc(servicesDir, options);
}

export type { RpcServerOptions };
