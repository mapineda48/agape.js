/**
 * Permission Matching Logic
 *
 * Shared permission matching utilities used by both RPC and Socket.IO authorization.
 * This module is the single source of truth for permission checking logic.
 */

/**
 * Checks if a user has a specific permission.
 *
 * Matching Rules:
 * - **Exact match**: `"sales.flow.deliver"` matches `"sales.flow.deliver"`
 * - **Super admin**: `"*"` matches everything
 * - **Module wildcard**: `"sales.*"` matches `"sales.flow.deliver"` and `"sales.invoice.create"`
 * - **Hierarchical wildcard**: `"sales.flow.*"` matches `"sales.flow.deliver"` but not `"sales.invoice.create"`
 *
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermission - The permission required for the operation
 * @returns true if user has the required permission
 *
 * @example
 * ```typescript
 * // Exact match
 * hasPermission(["sales.flow.deliver"], "sales.flow.deliver"); // true
 *
 * // Super admin
 * hasPermission(["*"], "any.permission.here"); // true
 *
 * // Module wildcard
 * hasPermission(["sales.*"], "sales.flow.deliver"); // true
 * hasPermission(["sales.*"], "inventory.count"); // false
 *
 * // No match
 * hasPermission(["sales.flow.deliver"], "sales.invoice.create"); // false
 * ```
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

    // Wildcard matching: "sales.*" matches "sales.flow.deliver"
    if (userPerm.endsWith(".*")) {
      const prefix = userPerm.slice(0, -2); // Remove ".*"
      return requiredPermission.startsWith(prefix + ".");
    }

    return false;
  });
}

/**
 * Checks if any of the user's permissions match any of the required permissions.
 *
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermissions - Array of permissions, any of which grants access
 * @returns true if user has at least one of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[],
): boolean {
  return requiredPermissions.some((required) =>
    hasPermission(userPermissions, required),
  );
}

/**
 * Checks if the user has all of the required permissions.
 *
 * @param userPermissions - Array of permissions the user has
 * @param requiredPermissions - Array of permissions, all of which are required
 * @returns true if user has all of the required permissions
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
): boolean {
  return requiredPermissions.every((required) =>
    hasPermission(userPermissions, required),
  );
}
