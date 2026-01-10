/**
 * RPC Authorization Module
 *
 * Provides authorization utilities for the RPC middleware.
 * Validates user permissions against required endpoint permissions.
 */

import ctx from "#lib/context";
import { ForbiddenError } from "#lib/error";
import { getRequiredPermission } from "./permissions";

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Checks if a user has a specific permission.
 *
 * Supports:
 * - Exact match: "sales.flow.deliver" matches "sales.flow.deliver"
 * - Wildcard: "sales.*" matches "sales.flow.deliver"
 * - Module wildcard: "sales.flow.*" matches "sales.flow.deliver"
 * - Super admin: "*" matches everything
 *
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermission - The permission required for the operation
 * @returns true if user has the required permission
 */
export function hasPermission(
    userPermissions: string[],
    requiredPermission: string
): boolean {
    if (!requiredPermission) return true;

    return userPermissions.some((userPerm) => {
        // Exact match
        if (userPerm === requiredPermission) return true;

        // Super admin wildcard
        if (userPerm === "*") return true;

        // Module wildcard: "sales.*" matches "sales.flow.deliver"
        if (userPerm.endsWith(".*")) {
            const prefix = userPerm.slice(0, -2); // Remove ".*"
            return requiredPermission.startsWith(prefix + ".");
        }

        // Hierarchical match: "sales.flow.*" matches "sales.flow.deliver"
        // but not "sales.invoice.create"
        if (userPerm.endsWith(".*")) {
            const parts = userPerm.split(".");
            parts.pop(); // Remove "*"
            const prefix = parts.join(".");
            return requiredPermission.startsWith(prefix + ".");
        }

        return false;
    });
}

/**
 * Validates that the current user has permission to access an endpoint.
 *
 * @param endpoint - The RPC endpoint path
 * @throws ForbiddenError if user lacks required permission
 */
export async function validateEndpointPermission(
    endpoint: string
): Promise<void> {
    const requiredPermission = await getRequiredPermission(endpoint);

    // No permission required - endpoint is public or unprotected
    if (!requiredPermission) {
        return;
    }

    // Get user permissions from context
    const userPermissions = ctx.permissions ?? [];

    // Check if user has the required permission
    if (!hasPermission(userPermissions, requiredPermission)) {
        throw new ForbiddenError(
            `Acceso denegado. Permiso requerido: ${requiredPermission}`,
            requiredPermission
        );
    }
}

/**
 * Returns permission info for debugging/admin purposes.
 */
export async function getEndpointPermissionInfo(endpoint: string): Promise<{
    endpoint: string;
    requiredPermission: string | null;
    isProtected: boolean;
}> {
    const requiredPermission = await getRequiredPermission(endpoint);

    return {
        endpoint,
        requiredPermission,
        isProtected: requiredPermission !== null,
    };
}
