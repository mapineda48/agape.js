/**
 * RBAC (Role-Based Access Control) Module
 *
 * Provides permission checking and route-to-permission mapping for the CMS.
 *
 * ## Permission Convention
 *
 * Permissions follow the pattern: `{module}.{resource}.{action}`
 *
 * Examples:
 * - `inventory.view` - Can access inventory module
 * - `inventory.product.create` - Can create products
 * - `sales.order.post` - Can post sales orders
 *
 * ## Wildcards
 *
 * - `*` - Super admin, access to everything
 * - `inventory.*` - All inventory permissions
 * - `inventory.product.*` - All product actions
 */

import { session } from "#services/security/session";
import {
  buildMenuPermissions,
  buildRoutePermissions,
} from "@mapineda48/agape-core/rbac/catalog";

// ============================================================================
// Route to Permission Mapping
// ============================================================================

/**
 * Maps CMS route prefixes to required permissions.
 * The order matters - more specific routes should come first.
 *
 * A route requires the permission if it matches exactly or starts with the prefix + "/".
 */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  ...buildRoutePermissions(),

  // Note: /cms/sales, /cms/purchasing, /cms/inventory, /cms/crm, /cms/invoicing, /cms/hr now come from buildRoutePermissions() via catalog

  // Dashboard & Reports
  "/cms/report": "report.view",
  "/cms": "cms.view", // Base access to CMS (most users should have this)
};

/**
 * Maps menu items to their required permissions.
 * Used by Sidebar to filter visible navigation items.
 */
export const MENU_PERMISSIONS: Record<string, string> = {
  ...buildMenuPermissions(),

  // Dashboard
  "/cms": "cms.view",
  "/cms/report": "report.view",

  // Note: /cms/sales/*, /cms/purchasing/*, /cms/inventory/*, /cms/crm/*, /cms/invoicing/*, /cms/hr/* now come from buildMenuPermissions() via catalog
};

// ============================================================================
// Permission Checking Utilities
// ============================================================================

/**
 * Checks if a permission string matches against a user permission.
 * Supports wildcards:
 * - `*` matches everything
 * - `inventory.*` matches `inventory.view`, `inventory.product.create`, etc.
 *
 * @param userPermission - Permission the user has (may include wildcards)
 * @param requiredPermission - Permission required for the action
 * @returns true if the user permission grants access
 */
export function matchPermission(
  userPermission: string,
  requiredPermission: string,
): boolean {
  // Exact match
  if (userPermission === requiredPermission) {
    return true;
  }

  // Super admin wildcard
  if (userPermission === "*") {
    return true;
  }

  // Wildcard pattern: "inventory.*" matches "inventory.view", "inventory.product.create"
  if (userPermission.endsWith(".*")) {
    const prefix = userPermission.slice(0, -2); // Remove ".*"
    return (
      requiredPermission === prefix ||
      requiredPermission.startsWith(prefix + ".")
    );
  }

  return false;
}

/**
 * Checks if the user has a specific permission.
 *
 * @param requiredPermission - The permission to check
 * @param userPermissions - Array of permissions the user has (defaults to session.permissions)
 * @returns true if the user has the required permission
 */
export function hasPermission(
  requiredPermission: string,
  userPermissions: string[] = session?.permissions ?? [],
): boolean {
  if (!requiredPermission) {
    return true; // No permission required
  }

  return userPermissions.some((userPerm) =>
    matchPermission(userPerm, requiredPermission),
  );
}

/**
 * Gets the required permission for a given route path.
 * Matches the most specific route prefix first.
 *
 * @param pathname - The route pathname to check
 * @returns The required permission, or null if no permission is required
 */
export function getRoutePermission(pathname: string): string | null {
  // Sort by specificity (longer paths first)
  const sortedRoutes = Object.entries(ROUTE_PERMISSIONS).sort(
    ([a], [b]) => b.length - a.length,
  );

  for (const [routePrefix, permission] of sortedRoutes) {
    if (pathname === routePrefix || pathname.startsWith(routePrefix + "/")) {
      return permission;
    }
  }

  return null;
}

/**
 * Checks if the user can access a specific route.
 *
 * @param pathname - The route pathname to check
 * @param userPermissions - Array of permissions the user has (defaults to session.permissions)
 * @returns true if the user can access the route
 */
export function canAccessRoute(
  pathname: string,
  userPermissions: string[] = session?.permissions ?? [],
): boolean {
  const requiredPermission = getRoutePermission(pathname);

  // No permission required for this route
  if (!requiredPermission) {
    return true;
  }

  return hasPermission(requiredPermission, userPermissions);
}

/**
 * Checks if a menu item should be visible to the user.
 *
 * @param menuPath - The menu item's path
 * @param userPermissions - Array of permissions the user has (defaults to session.permissions)
 * @returns true if the menu item should be visible
 */
export function canViewMenuItem(
  menuPath: string,
  userPermissions: string[] = session?.permissions ?? [],
): boolean {
  const requiredPermission = MENU_PERMISSIONS[menuPath];

  // No permission defined for this menu item - show by default
  if (!requiredPermission) {
    return true;
  }

  return hasPermission(requiredPermission, userPermissions);
}

// ============================================================================
// Permission Utilities for UI
// ============================================================================

/**
 * Filters an array of menu items based on user permissions.
 *
 * @param items - Array of items with a `path` property
 * @param userPermissions - Array of permissions the user has
 * @returns Filtered array of items the user can access
 */
export function filterMenuItems<T extends { path: string }>(
  items: T[],
  userPermissions: string[] = session?.permissions ?? [],
): T[] {
  return items.filter((item) => canViewMenuItem(item.path, userPermissions));
}

/**
 * Permission constants for common actions.
 * Use these constants in @permission JSDoc tags for consistency.
 */
export const Permission = {
  // Module views (for menu/navigation)
  CMS_VIEW: "cms.view",
  INVENTORY_VIEW: "inventory.view",
  SALES_VIEW: "sales.view",
  PURCHASING_VIEW: "purchasing.view",
  INVOICING_VIEW: "invoicing.view",
  CRM_VIEW: "crm.view",
  HR_VIEW: "hr.view",
  REPORT_VIEW: "report.view",
  CONFIG_ADMIN: "configuration.admin",

  // Common actions pattern
  READ: "read",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  MANAGE: "manage", // CRUD combined
  POST: "post", // For document posting
  CANCEL: "cancel", // For document cancellation
} as const;

export type PermissionKey = keyof typeof Permission;
