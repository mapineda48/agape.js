/**
 * RPC Authorization Module
 *
 * Provides authorization utilities for the RPC middleware.
 * Uses the unified RBAC module for permission checking.
 *
 * Access Control Levels:
 * - @public: No authentication required
 * - @permission <name>: Specific permission required
 * - No tag: Any authenticated user can access
 */

import { createPermissionValidator, getPermissionInfo as getInfo } from "#lib/rbac";
import { getRequiredPermission } from "./permissions";

// Re-export hasPermission from unified RBAC for backwards compatibility
export { hasPermission } from "#lib/rbac";

/**
 * Validates that the current user has permission to access an RPC endpoint.
 *
 * Uses the unified context system, so this works regardless of whether
 * the request originated from HTTP or was called from a Socket.IO handler.
 *
 * @param endpoint - The RPC endpoint path
 * @throws UnauthorizedError if authentication is required but missing
 * @throws ForbiddenError if user lacks required permission
 */
export const validateEndpointPermission = createPermissionValidator(getRequiredPermission);

/**
 * Returns permission info for debugging/admin purposes.
 */
export async function getEndpointPermissionInfo(endpoint: string): Promise<{
  endpoint: string;
  requiredPermission: string | null;
  isProtected: boolean;
  isPublic: boolean;
}> {
  const info = await getInfo(endpoint, getRequiredPermission);

  return {
    endpoint,
    requiredPermission: info.permission,
    isProtected: info.isProtected,
    isPublic: info.isPublic,
  };
}
