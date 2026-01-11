#!/usr/bin/env tsx
/**
 * Permission Extraction Script
 *
 * Scans service files for @permission JSDoc tags and generates a
 * TypeScript file mapping RPC endpoints to their required permissions.
 *
 * This script runs at build-time (prebuild) and uses the TypeScript
 * compiler API to parse JSDoc comments. The generated file is then
 * compiled along with the rest of the application.
 *
 * Usage:
 *   tsx lib/rpc/extract-permissions.ts
 *
 * Output:
 *   lib/rpc/permissions.generated.ts
 */

import fs from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

// ============================================================================
// Configuration
// ============================================================================

/** Root directory for service files */
const SVC_DIR = path.resolve("svc");

/** Output file path */
const OUTPUT_FILE = path.resolve("lib/rpc/permissions.generated.ts");

/** File extension to scan */
const FILE_EXTENSION = ".ts";

/** Glob patterns to exclude */
const EXCLUDED_PATTERNS = [".d.ts", ".test.ts"];

// ============================================================================
// JSDoc Permission Extraction
// ============================================================================

interface PermissionEntry {
    functionName: string;
    permission: string;
    line: number;
}

/**
 * Extracts @permission tags from a TypeScript source file.
 */
function extractPermissions(sourceCode: string): PermissionEntry[] {
    const entries: PermissionEntry[] = [];

    const sourceFile = ts.createSourceFile(
        "temp.ts",
        sourceCode,
        ts.ScriptTarget.Latest,
        true // setParentNodes for JSDoc access
    );

    function visit(node: ts.Node) {
        let functionName: string | null = null;
        let targetNode: ts.Node = node;

        // Function declaration: function foo() {}
        if (ts.isFunctionDeclaration(node) && node.name) {
            functionName = node.name.text;
        }

        // Variable declaration with arrow function: const foo = () => {}
        // JSDoc is attached to the VariableStatement, not VariableDeclaration
        if (ts.isVariableStatement(node)) {
            const declaration = node.declarationList.declarations[0];
            if (
                declaration &&
                ts.isIdentifier(declaration.name) &&
                hasCallableInitializer(declaration)
            ) {
                functionName = declaration.name.text;
                targetNode = node; // JSDoc is on the statement
            }
        }

        // Method declaration in a class
        if (ts.isMethodDeclaration(node) && node.name) {
            if (ts.isIdentifier(node.name)) {
                functionName = node.name.text;
            } else if (ts.isStringLiteral(node.name)) {
                functionName = node.name.text;
            }
        }

        // Extract @permission tag if we found a function
        if (functionName) {
            const permission = getPermissionTag(targetNode);
            if (permission) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(
                    node.getStart(sourceFile, false)
                );
                entries.push({
                    functionName,
                    permission,
                    line: line + 1,
                });
            }
        }

        // Export declaration with re-exports: export { a, b } from "..."
        if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
            const permission = getPermissionTag(node);
            if (permission) {
                for (const element of node.exportClause.elements) {
                    const name = element.name.text;
                    const { line } = sourceFile.getLineAndCharacterOfPosition(
                        node.getStart(sourceFile, false)
                    );
                    entries.push({
                        functionName: name,
                        permission,
                        line: line + 1,
                    });
                }
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return entries;
}

/**
 * Checks if a variable declaration has a callable initializer (arrow function, etc.)
 */
function hasCallableInitializer(decl: ts.VariableDeclaration): boolean {
    const init = decl.initializer;
    return !!(
        init &&
        (ts.isArrowFunction(init) ||
            ts.isFunctionExpression(init) ||
            ts.isCallExpression(init))
    );
}

/**
 * Extracts the @permission tag value from a node's JSDoc comments.
 * Sanitizes the result to remove newlines and extra whitespace.
 */
function getPermissionTag(node: ts.Node): string | null {
    const tags = ts.getJSDocTags(node);
    const permTag = tags.find((t) => t.tagName?.text === "permission");

    if (!permTag?.comment) return null;

    let permission: string | null = null;

    if (typeof permTag.comment === "string") {
        permission = permTag.comment;
    } else if (Array.isArray(permTag.comment)) {
        permission = permTag.comment
            .map((part) => (typeof part === "string" ? part : part.text))
            .join("");
    }

    if (!permission) return null;

    // Sanitize: remove newlines and trim whitespace
    // Sometimes JSDoc comments can span multiple lines
    return permission.split("\n")[0].trim();
}

// ============================================================================
// File Discovery
// ============================================================================

/**
 * Recursively finds all service files.
 */
async function* findServiceFiles(dir: string): AsyncGenerator<string> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            yield* findServiceFiles(fullPath);
        } else if (entry.isFile() && isServiceFile(entry.name)) {
            yield fullPath;
        }
    }
}

/**
 * Checks if a filename is a valid service file.
 */
function isServiceFile(filename: string): boolean {
    if (!filename.endsWith(FILE_EXTENSION)) return false;

    for (const pattern of EXCLUDED_PATTERNS) {
        if (filename.endsWith(pattern)) return false;
    }

    return true;
}

// ============================================================================
// Endpoint Path Generation
// ============================================================================

/**
 * Converts a file path to a public URL path.
 * Mirrors the logic in lib/rpc/path.ts
 */
function toPublicUrl(relativePath: string): string {
    return (
        "/" +
        relativePath
            .replace(/\\/g, "/") // Windows compatibility
            .replace(FILE_EXTENSION, "")
            .replace("/index", "")
            .replace("index", "")
    );
}

/**
 * Generates the endpoint path for an exported function.
 */
function getEndpointPath(publicUrl: string, exportName: string): string {
    const suffix = exportName !== "default" ? `/${exportName}` : "";
    return publicUrl + suffix;
}

// ============================================================================
// Permission Map Generation
// ============================================================================

interface PermissionMap {
    [endpoint: string]: string;
}

/**
 * Scans all service files and builds the permission map.
 */
async function buildPermissionMap(): Promise<PermissionMap> {
    const permissions: PermissionMap = {};

    for await (const filePath of findServiceFiles(SVC_DIR)) {
        const relativePath = path.relative(SVC_DIR, filePath);
        const publicUrl = toPublicUrl(relativePath);


        const sourceCode = await fs.readFile(filePath, "utf-8");
        const entries = extractPermissions(sourceCode);

        for (const entry of entries) {
            const endpoint = getEndpointPath(publicUrl, entry.functionName);
            permissions[endpoint] = entry.permission;
        }
    }

    return permissions;
}

/**
 * Generates the TypeScript source code for the permissions module.
 */
function generatePermissionsModule(permissions: PermissionMap): string {
    const entries = Object.entries(permissions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([endpoint, permission]) => `  "${endpoint}": "${permission}"`)
        .join(",\n");

    return `/**
 * Auto-generated RPC Permission Map
 *
 * DO NOT EDIT MANUALLY - This file is generated by extract-permissions.ts
 * Generated at: ${new Date().toISOString()}
 *
 * Maps RPC endpoints to their required permission strings.
 * Endpoints not listed here are considered public (no permission required).
 */

/**
 * Map of RPC endpoint paths to required permissions.
 */
export const rpcPermissions: Record<string, string> = {
${entries}
};

/**
 * Gets the required permission for an endpoint.
 * Returns null if no permission is required (public endpoint).
 */
export function getRequiredPermission(endpoint: string): string | null {
  return rpcPermissions[endpoint] ?? null;
}

/**
 * Checks if an endpoint requires authentication.
 */
export function isProtectedEndpoint(endpoint: string): boolean {
  return endpoint in rpcPermissions;
}
`;
}

// ============================================================================
// Main Execution
// ============================================================================

// ============================================================================
// Main Execution
// ============================================================================

export async function buildAndGenerate(outputPath: string = OUTPUT_FILE) {
    console.log("🔐 Extracting RPC permissions...");

    const permissions = await buildPermissionMap();
    const moduleCode = generatePermissionsModule(permissions);

    await fs.writeFile(outputPath, moduleCode, "utf-8");

    const endpointCount = Object.keys(permissions).length;
    console.log(`✅ Generated ${outputPath}`);
    console.log(`   ${endpointCount} protected endpoints found`);

    // Show a preview of what was found
    if (endpointCount > 0) {
        console.log("\n   Sample endpoints:");
        const sample = Object.entries(permissions).slice(0, 5);
        for (const [endpoint, permission] of sample) {
            console.log(`   • ${endpoint} → ${permission}`);
        }
    }

    return permissions;
}

import { navigationPermissions } from "./permissions.generated.js";

export function generateJavaScriptModule(permissions: PermissionMap): string {
    const rpcEntries = Object.entries(permissions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([endpoint, permission]) => `  "${endpoint}": "${permission}"`)
        .join(",\n");

    const navEntries = Object.entries(navigationPermissions)
        .map(([key, value]) => `  "${key}": "${value}"`)
        .join(",\n");

    return `/**
 * Permissions Configuration (Production)
 * 
 * Generated at: ${new Date().toISOString()}
 * 
 * Contains:
 * - Navigation permissions (constant, for routing/menu)
 * - RPC permissions (auto-generated from @permission JSDoc)
 */

// ============================================================================
// Navigation Permissions (CONSTANT)
// ============================================================================

/**
 * Constant permissions for module navigation/view access.
 */
export const navigationPermissions = {
${navEntries}
};

// ============================================================================
// RPC Permissions (AUTO-GENERATED)
// ============================================================================

/**
 * Map of RPC endpoint paths to required permissions.
 */
export const rpcPermissions = {
${rpcEntries}
};

// ============================================================================
// Combined Permissions
// ============================================================================

/**
 * All permissions available in the system.
 */
export const allPermissions = {
  ...navigationPermissions,
  ...rpcPermissions,
};

/**
 * Gets the required permission for an RPC endpoint.
 * Returns null if no permission is required (public endpoint).
 */
export function getRequiredPermission(endpoint) {
  return rpcPermissions[endpoint] ?? null;
}

/**
 * Checks if an RPC endpoint requires authentication.
 */
export function isProtectedEndpoint(endpoint) {
  return endpoint in rpcPermissions;
}

/**
 * Checks if a permission key is valid (exists in the system).
 */
export function isValidPermission(permission) {
  return permission in allPermissions;
}

/**
 * Gets all permission keys as an array.
 */
export function getAllPermissionKeys() {
  return Object.keys(allPermissions);
}
`;
}

// Check if run directly
import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    buildAndGenerate().catch((err) => {
        console.error("❌ Error extracting permissions:", err);
        process.exit(1);
    });
}

export { buildPermissionMap, generatePermissionsModule };
