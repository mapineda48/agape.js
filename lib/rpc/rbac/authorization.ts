/**
 * RPC Authorization Module
 *
 * Provides authorization utilities for the RPC middleware.
 * Validates user permissions against required endpoint permissions.
 *
 * Access Control Levels:
 * - @public: No authentication required
 * - @permission <name>: Specific permission required
 * - No tag: Any authenticated user can access
 */

import ctx from "#lib/context";
import { ForbiddenError, UnauthorizedError } from "#lib/error";
import { getRequiredPermission, PermissionLevel } from "./permissions";

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
  requiredPermission: string,
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
 * Checks if the current context represents an authenticated user.
 */
function isAuthenticated(): boolean {
  // User ID 0 represents an unauthenticated user
  return ctx.id !== 0;
}

/**
 * Validates that the current user has permission to access an endpoint.
 *
 * Access Control Logic:
 * 1. @public endpoints → Always allowed
 * 2. @permission <name> → User must have the specific permission
 * 3. No tag → User must be authenticated (any valid user)
 *
 * @param endpoint - The RPC endpoint path
 * @throws UnauthorizedError if authentication is required but missing
 * @throws ForbiddenError if user lacks required permission
 */
export async function validateEndpointPermission(
  endpoint: string,
): Promise<void> {
  const requiredPermission = await getRequiredPermission(endpoint);

  // @public endpoint - no authentication required
  if (requiredPermission === PermissionLevel.PUBLIC) {
    return;
  }

  // All other endpoints require authentication
  if (!isAuthenticated()) {
    throw new UnauthorizedError("Autenticación requerida");
  }

  // No specific permission tag - any authenticated user can access
  if (!requiredPermission) {
    return;
  }

  // Specific permission required - check if user has it
  const userPermissions = ctx.permissions ?? [];

  if (!hasPermission(userPermissions, requiredPermission)) {
    throw new ForbiddenError(
      `Acceso denegado. Permiso requerido: ${requiredPermission}`,
      requiredPermission,
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
  isPublic: boolean;
}> {
  const requiredPermission = await getRequiredPermission(endpoint);

  return {
    endpoint,
    requiredPermission,
    isProtected: requiredPermission !== null && requiredPermission !== PermissionLevel.PUBLIC,
    isPublic: requiredPermission === PermissionLevel.PUBLIC,
  };
}
