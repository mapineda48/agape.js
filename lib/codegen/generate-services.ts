/**
 * Service Client Code Generator
 *
 * Generates barrel export files in web/__generated__/services/ that replace
 * the Vite virtual modules (@agape/* → #services/*).
 *
 * Each service file gets a corresponding generated file with makeRpc/makeSocket calls.
 *
 * Usage: tsx --tsconfig tsconfig.app.json lib/codegen/generate-services.ts
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { cwd, findServices, toPublicUrl, getEndpointPath } from "../rpc/path";
import { NamespaceManager } from "../socket/namespace";
import Schema from "../db/schema";

Schema.setSchemaName(import.meta.filename);

const OUTPUT_DIR = path.resolve("web/__generated__/services");

async function main() {
  // Clean output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for await (const relativePath of findServices()) {
    const absolutePath = path.join(cwd, relativePath);
    const moduleUrl = pathToFileURL(absolutePath).href;
    const publicUrl = toPublicUrl(relativePath);

    const module = (await import(moduleUrl)) as Record<string, unknown>;
    const lines: string[] = [];
    let hasRpc = false;
    let hasSocket = false;

    for (const [exportName, exportValue] of Object.entries(module)) {
      if (typeof exportValue === "function") {
        if (!hasRpc) {
          lines.unshift('import makeRpc from "#web/utils/rpc";');
          hasRpc = true;
        }

        const endpoint = getEndpointPath(publicUrl, exportName);

        if (exportName === "default") {
          lines.push(`export default makeRpc("${endpoint}");`);
        } else {
          lines.push(`export const ${exportName} = makeRpc("${endpoint}");`);
        }
        continue;
      }

      if (exportValue instanceof NamespaceManager) {
        if (!hasSocket) {
          lines.unshift('import makeSocket from "#web/utils/socket";');
          hasSocket = true;
        }

        const endpoint = getEndpointPath(publicUrl, exportName);

        if (exportName === "default") {
          lines.push(`export default makeSocket("${endpoint}");`);
        } else {
          lines.push(`export const ${exportName} = makeSocket("${endpoint}");`);
        }
        continue;
      }
    }

    if (lines.length === 0) continue;

    // Determine output file path
    // services/public.ts → web/__generated__/services/public.ts
    // services/security/user.ts → web/__generated__/services/security/user.ts
    const outFile = path.join(
      OUTPUT_DIR,
      relativePath.replace(/\.(ts|js)$/, ".ts"),
    );

    const outDir = path.dirname(outFile);
    fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(outFile, lines.join("\n") + "\n");
    console.log(`Generated: ${path.relative(process.cwd(), outFile)}`);
  }

  // Generate security/session static module
  const sessionDir = path.join(OUTPUT_DIR, "security");
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(
    path.join(sessionDir, "session.ts"),
    "export * from '#web/utils/session';\n",
  );
  console.log("Generated: web/__generated__/services/security/session.ts");
}

await main();
