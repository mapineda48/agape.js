/**
 * Service Module Introspector
 *
 * Reads a TypeScript service file and extracts its export names and types
 * using simple regex parsing (no need to actually import/execute the module).
 *
 * This avoids needing tsx/database/infrastructure just to discover exports.
 *
 * Usage: node introspect.cjs <path-to-service-file>
 * Output: JSON { exports: [{ name, type }] }
 */

const fs = require("fs");
const path = require("path");

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node introspect.cjs <file>");
  process.exit(1);
}

const source = fs.readFileSync(filePath, "utf-8");
const result = [];

// Detect if file imports NamespaceManager or registerNamespace (socket service)
const isSocketFile =
  /import\s+.*(?:NamespaceManager|registerNamespace)/.test(source);

// Match: export function name(
const namedFnRegex = /export\s+function\s+(\w+)\s*\(/g;
let match;
while ((match = namedFnRegex.exec(source)) !== null) {
  result.push({ name: match[1], type: "function" });
}

// Match: export async function name(
const namedAsyncFnRegex = /export\s+async\s+function\s+(\w+)\s*\(/g;
while ((match = namedAsyncFnRegex.exec(source)) !== null) {
  result.push({ name: match[1], type: "function" });
}

// Match: export default function
if (/export\s+default\s+(async\s+)?function/.test(source)) {
  result.push({ name: "default", type: "function" });
}

// Match: export default socket (socket namespace)
// Detect patterns like: export default socket
if (isSocketFile && /export\s+default\s+\w+/.test(source) && !/export\s+default\s+(async\s+)?function/.test(source)) {
  result.push({ name: "default", type: "socket" });
}

// Match: export const name = registerNamespace
const namedSocketRegex =
  /export\s+const\s+(\w+)\s*=\s*registerNamespace/g;
while ((match = namedSocketRegex.exec(source)) !== null) {
  result.push({ name: match[1], type: "socket" });
}

console.log(JSON.stringify({ exports: result }));
