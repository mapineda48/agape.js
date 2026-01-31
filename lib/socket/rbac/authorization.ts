/**
 * Socket Namespace Authorization Module
 *
 * Provides authorization utilities for Socket.IO namespace connections.
 * Validates user permissions against required namespace permissions.
 *
 * Access Control Levels:
 * - @public: No authentication required to connect
 * - @permission <name>: Specific permission required to connect
 * - No tag: Any authenticated user can connect
 */

import { ForbiddenError, UnauthorizedError } from "#lib/error";
import { getRequiredPermission, PermissionLevel } from "./permissions";

// ============================================================================
// Types
// ============================================================================

/**
 * User payload from JWT token, attached to socket.data.user
 */
export interface SocketUserPayload {
  id: number;
  tenant: string;
  permissions: string[];
  [key: string]: unknown;
}

/**
 * Result of namespace permission check
 */
export interface NamespaceAuthResult {
  allowed: boolean;
  isPublic: boolean;
  requiresAuth: boolean;
  requiredPermission: string | null;
}

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

    return false;
  });
}

/**
 * Validates that a user can connect to a namespace.
 *
 * Access Control Logic:
 * 1. @public namespaces → Always allowed
 * 2. @permission <name> → User must have the specific permission
 * 3. No tag → User must be authenticated (any valid user)
 *
 * @param namespace - The Socket.IO namespace path
 * @param user - The user payload from JWT (null if unauthenticated)
 * @throws UnauthorizedError if authentication is required but missing
 * @throws ForbiddenError if user lacks required permission
 */
export async function validateNamespaceConnection(
  namespace: string,
  user: SocketUserPayload | null,
): Promise<void> {
  const requiredPermission = await getRequiredPermission(namespace);

  // @public namespace - no authentication required
  if (requiredPermission === PermissionLevel.PUBLIC) {
    return;
  }

  // All other namespaces require authentication
  if (!user || user.id === 0) {
    throw new UnauthorizedError("Autenticación requerida");
  }

  // No specific permission tag - any authenticated user can connect
  if (!requiredPermission) {
    return;
  }

  // Specific permission required - check if user has it
  const userPermissions = user.permissions ?? [];

  if (!hasPermission(userPermissions, requiredPermission)) {
    throw new ForbiddenError(
      `Acceso denegado al namespace. Permiso requerido: ${requiredPermission}`,
      requiredPermission,
    );
  }
}

/**
 * Checks namespace access without throwing (for middleware use).
 *
 * @param namespace - The Socket.IO namespace path
 * @param user - The user payload from JWT (null if unauthenticated)
 * @returns Authorization result with details
 */
export async function checkNamespaceAccess(
  namespace: string,
  user: SocketUserPayload | null,
): Promise<NamespaceAuthResult> {
  const requiredPermission = await getRequiredPermission(namespace);

  // @public namespace
  if (requiredPermission === PermissionLevel.PUBLIC) {
    return {
      allowed: true,
      isPublic: true,
      requiresAuth: false,
      requiredPermission: null,
    };
  }

  // Check authentication
  const isAuthenticated = user && user.id !== 0;
  if (!isAuthenticated) {
    return {
      allowed: false,
      isPublic: false,
      requiresAuth: true,
      requiredPermission,
    };
  }

  // No specific permission - any authenticated user
  if (!requiredPermission) {
    return {
      allowed: true,
      isPublic: false,
      requiresAuth: true,
      requiredPermission: null,
    };
  }

  // Check specific permission
  const userPermissions = user.permissions ?? [];
  const allowed = hasPermission(userPermissions, requiredPermission);

  return {
    allowed,
    isPublic: false,
    requiresAuth: true,
    requiredPermission,
  };
}

/**
 * Returns permission info for debugging/admin purposes.
 */
export async function getNamespacePermissionInfo(namespace: string): Promise<{
  namespace: string;
  requiredPermission: string | null;
  isProtected: boolean;
  isPublic: boolean;
}> {
  const requiredPermission = await getRequiredPermission(namespace);

  return {
    namespace,
    requiredPermission,
    isProtected: requiredPermission !== null && requiredPermission !== PermissionLevel.PUBLIC,
    isPublic: requiredPermission === PermissionLevel.PUBLIC,
  };
}
