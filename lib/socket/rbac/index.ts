/**
 * Socket RBAC Module
 *
 * Re-exports all socket authorization utilities.
 */

export {
  PermissionLevel,
  getRequiredPermission,
  getPermissionInfo,
  initSocketPermissions,
  invalidatePermissionCache,
  clearPermissionCache,
} from "./permissions";

export {
  hasPermission,
  validateNamespaceConnection,
  checkNamespaceAccess,
  getNamespacePermissionInfo,
  type SocketUserPayload,
  type NamespaceAuthResult,
} from "./authorization";
