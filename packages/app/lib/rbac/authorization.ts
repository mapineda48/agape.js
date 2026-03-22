/**
 * Unified Authorization Module
 *
 * Provides authorization utilities for both RPC and Socket.IO.
 * Uses the unified context system for permission validation.
 *
 * Access Control Levels:
 * - @public: No authentication required
 * - @permission <name>: Specific permission required
 * - No tag: Any authenticated user can access
 */

import ctx from "#lib/context";
import { ForbiddenError, UnauthorizedError } from "#lib/error";
import { PermissionLevel, type PermissionInfo } from "./constants.js";
import { hasPermission } from "./hasPermission.js";

// Re-export for convenience
export { hasPermission, hasAnyPermission, hasAllPermissions } from "./hasPermission.js";
export { PermissionLevel, type PermissionInfo } from "./constants.js";

/**
 * Checks if the current context represents an authenticated user.
 * Works with both HTTP and Socket contexts.
 */
export function isAuthenticated(): boolean {
  return ctx.id !== 0;
}

/**
 * Gets the current user's permissions from context.
 */
export function getCurrentPermissions(): string[] {
  return ctx.permissions ?? [];
}

/**
 * Checks if the current user has a specific permission.
 *
 * @param permission - The permission to check
 * @returns true if user has the permission
 */
export function currentUserHasPermission(permission: string): boolean {
  return hasPermission(getCurrentPermissions(), permission);
}

/**
 * Permission resolver function type.
 * Used to get the required permission for an endpoint/namespace.
 */
export type PermissionResolver = (path: string) => Promise<string | null>;

/**
 * Creates a permission validator function for RPC or Socket authorization.
 *
 * @param getRequiredPermission - Function to resolve required permission for a path
 * @returns Validator function that throws on unauthorized/forbidden access
 *
 * @example
 * ```typescript
 * import { getRequiredPermission } from "./permissions.js";
 *
 * const validateEndpointPermission = createPermissionValidator(getRequiredPermission);
 *
 * // In middleware
 * await validateEndpointPermission("/users/delete");
 * ```
 */
export function createPermissionValidator(
  getRequiredPermission: PermissionResolver,
): (path: string) => Promise<void> {
  return async function validatePermission(path: string): Promise<void> {
    const requiredPermission = await getRequiredPermission(path);

    // @public endpoint/namespace - no authentication required
    if (requiredPermission === PermissionLevel.PUBLIC) {
      return;
    }

    // All other endpoints/namespaces require authentication
    if (!isAuthenticated()) {
      throw new UnauthorizedError("Autenticación requerida");
    }

    // No specific permission tag - any authenticated user can access
    if (!requiredPermission) {
      return;
    }

    // Specific permission required - check if user has it
    const userPermissions = getCurrentPermissions();

    if (!hasPermission(userPermissions, requiredPermission)) {
      throw new ForbiddenError(
        `Acceso denegado. Permiso requerido: ${requiredPermission}`,
        requiredPermission,
      );
    }
  };
}

/**
 * Creates a permission checker function that doesn't throw.
 * Useful for conditional logic based on permissions.
 *
 * @param getRequiredPermission - Function to resolve required permission for a path
 * @returns Checker function that returns access result
 */
export function createPermissionChecker(
  getRequiredPermission: PermissionResolver,
): (
  path: string,
  userPermissions: string[] | null,
  userId: number | null,
) => Promise<{
  allowed: boolean;
  isPublic: boolean;
  requiresAuth: boolean;
  requiredPermission: string | null;
}> {
  return async function checkPermission(
    path: string,
    userPermissions: string[] | null,
    userId: number | null,
  ) {
    const requiredPermission = await getRequiredPermission(path);

    // @public endpoint/namespace
    if (requiredPermission === PermissionLevel.PUBLIC) {
      return {
        allowed: true,
        isPublic: true,
        requiresAuth: false,
        requiredPermission: null,
      };
    }

    // Check authentication
    const isUserAuthenticated = userId !== null && userId !== 0;
    if (!isUserAuthenticated) {
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
    const allowed = hasPermission(userPermissions ?? [], requiredPermission);

    return {
      allowed,
      isPublic: false,
      requiresAuth: true,
      requiredPermission,
    };
  };
}

/**
 * Returns permission info for debugging/admin purposes.
 */
export async function getPermissionInfo(
  path: string,
  getRequiredPermission: PermissionResolver,
): Promise<PermissionInfo & { path: string }> {
  const requiredPermission = await getRequiredPermission(path);

  return {
    path,
    permission: requiredPermission,
    isProtected:
      requiredPermission !== null &&
      requiredPermission !== PermissionLevel.PUBLIC,
    isPublic: requiredPermission === PermissionLevel.PUBLIC,
  };
}
