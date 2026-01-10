/**
 * RPC Permission Resolver
 *
 * Provides permission checking for RPC endpoints.
 *
 * Strategy:
 * - Development: Parse JSDoc on-the-fly using TypeScript (hot-reload friendly)
 * - Production: Use pre-generated permission map (no TS dependency)
 */

import path from "node:path";
import { cwd, findServices } from "./path";

// ============================================================================
// Types
// ============================================================================

export interface PermissionInfo {
    permission: string | null;
    isProtected: boolean;
}

// ============================================================================
// Production Strategy: Use Generated File
// ============================================================================

// Import pre-generated permissions (will exist after build)
let generatedPermissions: Record<string, string> | null = null;

async function loadGeneratedPermissions(): Promise<Record<string, string>> {
    if (generatedPermissions) return generatedPermissions;

    try {
        const module = await import("./permissions.generated.js");
        generatedPermissions = module.rpcPermissions;
        return generatedPermissions;
    } catch {
        // File doesn't exist yet (first run in dev)
        return {};
    }
}

function getPermissionFromGenerated(endpoint: string): string | null {
    return generatedPermissions?.[endpoint] ?? null;
}

// ============================================================================
// Development Strategy: Parse JSDoc On-The-Fly
// ============================================================================

/** Cache of file → permissions map for development */
const devPermissionCache = new Map<string, Map<string, string>>();

/** Cache of endpoint → file mapping */
const endpointToFileCache = new Map<string, string>();

/**
 * Parses @permission tags from a TypeScript source file.
 * Uses dynamic import to avoid TypeScript dependency in production.
 */
async function parsePermissionsFromFile(
    absolutePath: string
): Promise<Map<string, string>> {
    // Dynamic import of TypeScript (only in dev)
    const ts = await import("typescript");

    const fs = await import("node:fs/promises");
    const sourceCode = await fs.readFile(absolutePath, "utf-8");

    const permissions = new Map<string, string>();

    const sourceFile = ts.createSourceFile(
        "temp.ts",
        sourceCode,
        ts.ScriptTarget.Latest,
        true
    );

    function visit(node: any) {
        let functionName: string | null = null;
        let targetNode: any = node;

        // Function declaration
        if (ts.isFunctionDeclaration(node) && node.name) {
            functionName = node.name.text;
        }

        // Variable statement with arrow function
        if (ts.isVariableStatement(node)) {
            const declaration = node.declarationList.declarations[0];
            if (declaration && ts.isIdentifier(declaration.name)) {
                const init = declaration.initializer;
                if (
                    init &&
                    (ts.isArrowFunction(init) ||
                        ts.isFunctionExpression(init) ||
                        ts.isCallExpression(init))
                ) {
                    functionName = declaration.name.text;
                    targetNode = node;
                }
            }
        }

        // Extract permission
        if (functionName) {
            const tags = ts.getJSDocTags(targetNode);
            const permTag = tags.find((t: any) => t.tagName?.text === "permission");

            if (permTag?.comment) {
                const permission =
                    typeof permTag.comment === "string"
                        ? permTag.comment.trim()
                        : Array.isArray(permTag.comment)
                            ? permTag.comment.map((p: any) => (typeof p === "string" ? p : p.text)).join("").trim()
                            : null;

                if (permission) {
                    permissions.set(functionName, permission);
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return permissions;
}

/**
 * Converts a relative path to a public URL (mirrors path.ts logic)
 */
function toPublicUrl(relativePath: string): string {
    const ext = path.extname(relativePath);
    return (
        "/" +
        relativePath
            .replace(/\\/g, "/")
            .replace(ext, "")
            .replace("/index", "")
            .replace("index", "")
    );
}

/**
 * Builds endpoint → file mapping (done once at startup in dev)
 */
async function buildEndpointToFileMapping(): Promise<void> {
    if (endpointToFileCache.size > 0) return;

    for await (const relativePath of findServices()) {
        const absolutePath = path.join(cwd, relativePath);
        const publicUrl = toPublicUrl(relativePath);

        // We need to import the module to see what's exported
        // But we'll map the base URL to the file
        endpointToFileCache.set(publicUrl, absolutePath);

        // For named exports, we'll check in getPermissionOnTheFly
    }
}

/**
 * Gets permission for an endpoint by parsing the source file.
 */
async function getPermissionOnTheFly(endpoint: string): Promise<string | null> {
    await buildEndpointToFileMapping();

    // Parse endpoint: /sales/flow/deliverSalesOrder → baseUrl=/sales/flow, exportName=deliverSalesOrder
    const parts = endpoint.split("/").filter(Boolean);
    let filePath: string | null = null;
    let exportName = "default";

    // Try progressively shorter paths to find the file
    for (let i = parts.length; i > 0; i--) {
        const testUrl = "/" + parts.slice(0, i).join("/");
        if (endpointToFileCache.has(testUrl)) {
            filePath = endpointToFileCache.get(testUrl)!;
            exportName = parts.slice(i).join("/") || "default";
            break;
        }
    }

    if (!filePath) return null;

    // Check cache first
    if (!devPermissionCache.has(filePath)) {
        const permissions = await parsePermissionsFromFile(filePath);
        devPermissionCache.set(filePath, permissions);
    }

    const filePermissions = devPermissionCache.get(filePath)!;
    return filePermissions.get(exportName) ?? null;
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
    endpointToFileCache.clear();
}

// ============================================================================
// Public API
// ============================================================================

const isDev = process.env.NODE_ENV === "development";

/**
 * Gets the required permission for an RPC endpoint.
 *
 * In development: Parses JSDoc on-the-fly (supports hot reload)
 * In production: Uses pre-generated map
 */
export async function getRequiredPermission(
    endpoint: string
): Promise<string | null> {
    if (isDev) {
        return getPermissionOnTheFly(endpoint);
    }

    await loadGeneratedPermissions();
    return getPermissionFromGenerated(endpoint);
}

/**
 * Gets full permission info for an endpoint.
 */
export async function getPermissionInfo(
    endpoint: string
): Promise<PermissionInfo> {
    const permission = await getRequiredPermission(endpoint);

    return {
        permission,
        isProtected: permission !== null,
    };
}

/**
 * Initialize the permission system.
 * In dev: Builds the endpoint mapping
 * In prod: Loads the generated permissions
 */
export async function initPermissions(): Promise<void> {
    if (isDev) {
        await buildEndpointToFileMapping();
        console.log("🔐 Permission system initialized (development mode)");
    } else {
        await loadGeneratedPermissions();
        const count = Object.keys(generatedPermissions ?? {}).length;
        console.log(`🔐 Permission system initialized (${count} protected endpoints)`);
    }
}
