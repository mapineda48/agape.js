/**
 * Next.js/Turbopack Webpack Loader for Virtual Service Modules
 *
 * Replaces Vite's virtual module plugin. When Turbopack resolves a file
 * matching services/*.ts, this loader intercepts it and returns generated
 * code with makeRpc/makeSocket calls instead of the actual file contents.
 *
 * This means:
 * - No codegen step needed in development
 * - import { sayHello } from "#services/public" resolves transparently
 * - The loader reads the real service file to discover exports, then
 *   generates client-side proxy code
 *
 * How it works:
 * 1. Turbopack resolveAlias maps #services/* → services/*
 * 2. A rule matches services/*.ts and applies this loader
 * 3. The loader spawns tsx to introspect the module's exports
 * 4. Returns generated code with makeRpc() / makeSocket() calls
 */

const { execSync } = require("child_process");
const path = require("path");

const SERVICES_DIR = path.resolve(__dirname, "../../services");

module.exports = function serviceLoader() {
  // Get the file path relative to services/
  const resourcePath = this.resourcePath;
  const relativePath = path.relative(SERVICES_DIR, resourcePath);

  // Skip non-service files
  if (!relativePath || relativePath.startsWith("..")) {
    return this.callback(null, "");
  }

  // Use the introspect script to get exports info
  try {
    const scriptPath = path.resolve(__dirname, "introspect.cjs");
    const stdout = execSync(
      `node "${scriptPath}" "${resourcePath}"`,
      {
        encoding: "utf-8",
        timeout: 10000,
        cwd: path.resolve(__dirname, "../.."),
      }
    ).trim();

    const result = JSON.parse(stdout);

    // Build the module URL from relative path
    // services/public.ts → /public
    // services/security/user.ts → /security/user
    const moduleUrl =
      "/" +
      relativePath
        .replace(/\.(ts|js)$/, "")
        .replace(/\/index$/, "")
        .replace(/^index$/, "");

    const lines = [];
    let hasRpc = false;
    let hasSocket = false;

    for (const exp of result.exports) {
      const endpoint =
        exp.name === "default"
          ? moduleUrl
          : moduleUrl + "/" + exp.name;

      if (exp.type === "function") {
        if (!hasRpc) {
          lines.unshift('import makeRpc from "#web/utils/rpc";');
          hasRpc = true;
        }
        if (exp.name === "default") {
          lines.push(`export default makeRpc("${endpoint}");`);
        } else {
          lines.push(`export const ${exp.name} = makeRpc("${endpoint}");`);
        }
      } else if (exp.type === "socket") {
        if (!hasSocket) {
          lines.unshift('import makeSocket from "#web/utils/socket";');
          hasSocket = true;
        }
        if (exp.name === "default") {
          lines.push(`export default makeSocket("${endpoint}");`);
        } else {
          lines.push(`export const ${exp.name} = makeSocket("${endpoint}");`);
        }
      }
    }

    return this.callback(null, lines.join("\n") + "\n");
  } catch (err) {
    this.emitWarning(
      new Error(`Failed to introspect service ${relativePath}: ${err.message}`)
    );
    return this.callback(null, "// Failed to generate service client\n");
  }
};
