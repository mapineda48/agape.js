/**
 * Socket Namespace Permission Resolver
 *
 * Provides permission checking for Socket.IO namespaces.
 * Works similarly to RPC permissions but at the namespace level.
 *
 * Strategy:
 * - Development: Parse JSDoc on-the-fly using TypeScript (hot-reload friendly)
 * - Production: Use pre-generated permission map (no TS dependency)
 *
 * Access Control Tags:
 * - @public: No authentication required to connect
 * - @permission <name>: Specific permission required to connect
 * - No tag: Any authenticated user can connect
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import type ts from "typescript";
import { createServiceDiscovery } from "@mapineda48/agape-rpc/server/discovery";
import { NamespaceManager } from "@mapineda48/agape-rpc/server/socket/namespace";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cwd = path.resolve(__dirname, "../../../services");
const { findServices, toPublicUrl, getEndpointPath } = createServiceDiscovery(cwd);

// ============================================================================
// Types (re-exported from unified RBAC)
// ============================================================================

import { PermissionLevel, type PermissionInfo } from "#lib/rbac";

export { PermissionLevel, type PermissionInfo };

// ============================================================================
// Production Strategy: Use Generated File
// ============================================================================

let generatedPermissions: Record<string, string> | null = null;

async function loadGeneratedPermissions(): Promise<Record<string, string>> {
  if (generatedPermissions) return generatedPermissions;

  try {
    const module = await import("./permissions.generated");
    generatedPermissions = module.socketPermissions;
    return generatedPermissions ?? {};
  } catch {
    // File doesn't exist yet (first run in dev)
    return {};
  }
}

function getPermissionFromGenerated(namespace: string): string | null {
  return generatedPermissions?.[namespace] ?? null;
}

// ============================================================================
// Development Strategy: Parse JSDoc On-The-Fly
// ============================================================================

/** Cache of file → permissions map for development */
const devPermissionCache = new Map<string, Map<string, string>>();

/** Cache of namespace → file mapping */
const namespaceToFileCache = new Map<string, { filePath: string; exportName: string }>();

/**
 * Parses @permission and @public tags from a TypeScript source file
 * for NamespaceManager exports.
 */
async function parseSocketPermissionsFromFile(
  absolutePath: string,
): Promise<Map<string, string>> {
  const ts = await import("typescript");
  const fs = await import("node:fs/promises");
  const sourceCode = await fs.readFile(absolutePath, "utf-8");

  const permissions = new Map<string, string>();

  const sourceFile = ts.createSourceFile(
    "temp.ts",
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
  );

  function visit(node: ts.Node) {
    let variableName: string | null = null;
    let targetNode: ts.Node = node;

    // Variable statement: const socket = registerNamespace()
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (declaration && ts.isIdentifier(declaration.name)) {
        const init = declaration.initializer;
        // Check if it's a registerNamespace call
        if (init && ts.isCallExpression(init)) {
          const callExpr = init.expression;
          if (ts.isIdentifier(callExpr) && callExpr.text === "registerNamespace") {
            variableName = declaration.name.text;
            targetNode = node;
          }
        }
      }
    }

    // Extract permission or public tag
    if (variableName) {
      const tags = ts.getJSDocTags(targetNode);

      // Check for @public tag first
      const publicTag = tags.find((t) => t.tagName?.text === "public");
      if (publicTag) {
        permissions.set(variableName, PermissionLevel.PUBLIC);
      } else {
        // Check for @permission tag
        const permTag = tags.find((t) => t.tagName?.text === "permission");

        if (permTag?.comment) {
          const permission =
            typeof permTag.comment === "string"
              ? permTag.comment.trim()
              : Array.isArray(permTag.comment)
                ? permTag.comment
                    .map((p) => (typeof p === "string" ? p : p.text))
                    .join("")
                    .trim()
                : null;

          if (permission) {
            permissions.set(variableName, permission);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return permissions;
}

/**
 * Builds namespace → file mapping by discovering NamespaceManager exports
 */
async function buildNamespaceToFileMapping(): Promise<void> {
  if (namespaceToFileCache.size > 0) return;

  const { pathToFileURL } = await import("node:url");

  for await (const relativePath of findServices()) {
    const absolutePath = path.join(cwd, relativePath);
    const moduleUrl = pathToFileURL(absolutePath).href;
    const publicUrl = toPublicUrl(relativePath);

    const module = await import(moduleUrl);

    for (const [exportName, exportValue] of Object.entries(module)) {
      if (exportValue instanceof NamespaceManager) {
        const namespace = getEndpointPath(publicUrl, exportName);
        namespaceToFileCache.set(namespace, { filePath: absolutePath, exportName });
      }
    }
  }
}

/**
 * Gets permission for a namespace by parsing the source file.
 */
async function getPermissionOnTheFly(namespace: string): Promise<string | null> {
  await buildNamespaceToFileMapping();

  const mapping = namespaceToFileCache.get(namespace);
  if (!mapping) return null;

  const { filePath, exportName } = mapping;

  // Check cache first
  if (!devPermissionCache.has(filePath)) {
    const permissions = await parseSocketPermissionsFromFile(filePath);
    devPermissionCache.set(filePath, permissions);
  }

  const filePermissions = devPermissionCache.get(filePath)!;

  // Map variable name to export name
  // For default export, check both "default" and the variable name
  const permission = filePermissions.get(exportName === "default" ? "socket" : exportName);

  // Also check if there's a variable that gets exported as default
  if (!permission && exportName === "default") {
    // Try to find any socket variable in the file
    for (const [varName, perm] of filePermissions) {
      return perm;
    }
  }

  return permission ?? null;
}

/**
 * Invalidates cache for a file (for HMR support)
 */
export function invalidatePermissionCache(filePath: string): void {
  devPermissionCache.delete(filePath);
}

/**
 * Clears all permission caches (for hot reload)
 */
export function clearPermissionCache(): void {
  devPermissionCache.clear();
  namespaceToFileCache.clear();
}

// ============================================================================
// Public API
// ============================================================================

const isDev = (process.env.NODE_ENV ?? (import.meta.filename.endsWith(".ts") ? "development" : "production")) === "development";

/**
 * Gets the required permission for a Socket.IO namespace.
 *
 * In development: Parses JSDoc on-the-fly (supports hot reload)
 * In production: Uses pre-generated map
 */
export async function getRequiredPermission(
  namespace: string,
): Promise<string | null> {
  if (isDev) {
    return getPermissionOnTheFly(namespace);
  }

  await loadGeneratedPermissions();
  return getPermissionFromGenerated(namespace);
}

/**
 * Gets full permission info for a namespace.
 */
export async function getPermissionInfo(
  namespace: string,
): Promise<PermissionInfo> {
  const permission = await getRequiredPermission(namespace);

  return {
    permission,
    isProtected: permission !== null && permission !== PermissionLevel.PUBLIC,
    isPublic: permission === PermissionLevel.PUBLIC,
  };
}

/**
 * Initialize the socket permission system.
 */
export async function initSocketPermissions(): Promise<void> {
  if (isDev) {
    await buildNamespaceToFileMapping();
    console.log("🔌 Socket permission system initialized (development mode)");
  } else {
    await loadGeneratedPermissions();
    const count = Object.keys(generatedPermissions ?? {}).length;
    console.log(
      `🔌 Socket permission system initialized (${count} protected namespaces)`,
    );
  }
}
