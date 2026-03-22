import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Absolute path to the services directory containing domain contracts.
 * Used by the Vite plugin to discover RPC endpoints and socket namespaces.
 */
export const servicesDir = path.resolve(__dirname, "services");
