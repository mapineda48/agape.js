/**
 * Service Client Code Generator (Lightweight)
 *
 * Generates barrel export files in web/__generated__/services/ using
 * regex-based introspection. Does NOT require tsx, database, or any
 * infrastructure — just reads .ts files and parses export patterns.
 *
 * This replaces the tsx-based generator for zero-dependency codegen,
 * making it safe to run from next.config.ts on startup.
 *
 * Usage: node lib/codegen/generate-services.cjs
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SERVICES_DIR = path.resolve(__dirname, "../../services");
const OUTPUT_DIR = path.resolve(__dirname, "../../web/__generated__/services");
const INTROSPECT_SCRIPT = path.resolve(__dirname, "../vite/introspect.cjs");

// Glob for .ts files excluding .d.ts and .test.ts
function findServiceFiles(dir, base) {
  base = base || dir;
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(findServiceFiles(fullPath, base));
    } else if (
      entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".d.ts") &&
      !entry.name.endsWith(".test.ts")
    ) {
      files.push(path.relative(base, fullPath));
    }
  }
  return files;
}

function getModuleUrl(relativePath) {
  return (
    "/" +
    relativePath
      .replace(/\.(ts|js)$/, "")
      .replace(/\/index$/, "")
      .replace(/^index$/, "")
  );
}

function generate() {
  // Clean output
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const serviceFiles = findServiceFiles(SERVICES_DIR);

  for (const relativePath of serviceFiles) {
    const absPath = path.join(SERVICES_DIR, relativePath);

    // Introspect exports via regex
    const stdout = execSync(`node "${INTROSPECT_SCRIPT}" "${absPath}"`, {
      encoding: "utf-8",
    }).trim();

    const { exports: exps } = JSON.parse(stdout);
    if (exps.length === 0) continue;

    const moduleUrl = getModuleUrl(relativePath);
    const lines = [];
    let hasRpc = false;
    let hasSocket = false;

    for (const exp of exps) {
      const endpoint =
        exp.name === "default" ? moduleUrl : moduleUrl + "/" + exp.name;

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
          lines.push(
            `export const ${exp.name} = makeSocket("${endpoint}");`
          );
        }
      }
    }

    // Write output file
    const outFile = path.join(OUTPUT_DIR, relativePath);
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, lines.join("\n") + "\n");
  }

  // Static module: security/session
  const sessionDir = path.join(OUTPUT_DIR, "security");
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(
    path.join(sessionDir, "session.ts"),
    "export * from '#web/utils/session';\n"
  );
}

generate();
