/**
 * Socket Namespace Authorization Module
 *
 * Provides authorization utilities for Socket.IO namespace connections.
 * Uses the unified RBAC module for permission checking.
 *
 * Access Control Levels:
 * - @public: No authentication required to connect
 * - @permission <name>: Specific permission required to connect
 * - No tag: Any authenticated user can connect
 */

import { ForbiddenError, UnauthorizedError } from "#lib/error";
import {
  hasPermission,
  createPermissionChecker,
  PermissionLevel,
} from "#lib/rbac";
import { getRequiredPermission } from "./permissions.js";

// Re-export from unified RBAC for backwards compatibility
export { hasPermission } from "#lib/rbac";

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
// Authorization Functions
// ============================================================================

/**
 * Internal permission checker using the unified RBAC.
 */
const checkPermission = createPermissionChecker(getRequiredPermission);

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
  return checkPermission(
    namespace,
    user?.permissions ?? null,
    user?.id ?? null,
  );
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
    isProtected:
      requiredPermission !== null &&
      requiredPermission !== PermissionLevel.PUBLIC,
    isPublic: requiredPermission === PermissionLevel.PUBLIC,
  };
}
