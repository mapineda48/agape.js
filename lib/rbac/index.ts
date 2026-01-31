/**
 * Unified RBAC Module
 *
 * Provides role-based access control utilities shared across RPC and Socket.IO.
 *
 * @example
 * ```typescript
 * import { hasPermission, isAuthenticated, PermissionLevel } from "#lib/rbac";
 *
 * // Check if user has permission
 * if (hasPermission(ctx.permissions, "admin.users.delete")) {
 *   await deleteUser(userId);
 * }
 *
 * // Check authentication
 * if (!isAuthenticated()) {
 *   throw new UnauthorizedError("Login required");
 * }
 * ```
 */

export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAuthenticated,
  getCurrentPermissions,
  currentUserHasPermission,
  createPermissionValidator,
  createPermissionChecker,
  getPermissionInfo,
  PermissionLevel,
  type PermissionInfo,
  type PermissionResolver,
} from "./authorization";
