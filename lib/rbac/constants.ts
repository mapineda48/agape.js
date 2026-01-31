/**
 * RBAC Constants
 *
 * Shared constants for role-based access control across RPC and Socket.IO.
 */

/**
 * Special permission values for access control.
 *
 * - `PUBLIC`: Endpoint/namespace is publicly accessible without authentication
 * - `AUTHENTICATED`: Endpoint/namespace requires any authenticated user
 */
export const PermissionLevel = {
  /** Public - no authentication required */
  PUBLIC: "__public__",
  /** Requires any authenticated user */
  AUTHENTICATED: "__authenticated__",
} as const;

export type PermissionLevelType =
  (typeof PermissionLevel)[keyof typeof PermissionLevel];

/**
 * Permission info structure returned by permission checks.
 */
export interface PermissionInfo {
  permission: string | null;
  isProtected: boolean;
  isPublic: boolean;
}
