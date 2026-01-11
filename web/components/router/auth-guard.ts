import { isAuthenticated, session } from "@agape/security/access";
import type { INavigateTo } from "./types";
import { canAccessRoute, getRoutePermission } from "@/lib/rbac";

// Re-export for backwards compatibility
export type { INavigateTo };

/**
 * Result of an auth guard check.
 */
export interface AuthGuardResult {
  /**
   * The pathname to navigate to.
   * May be different from the original if a redirect is needed.
   */
  pathname: string;

  /**
   * If set, the user was authenticated but lacks the required permission.
   * The router should render the Unauthorized component instead of the page.
   */
  deniedPermission?: string;
}

/**
 * Helper to check if a pathname matches a protected route prefix.
 * Uses strict matching: exact match OR prefix followed by '/'.
 *
 * @example
 * isProtectedRoute("/cms", "/cms") // true
 * isProtectedRoute("/cms", "/cms/dashboard") // true
 * isProtectedRoute("/cms", "/cms-other") // false - this was a bug before!
 */
function isProtectedRoute(prefix: string, pathname: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

/**
 * Authentication and authorization guard that controls access to protected routes.
 *
 * ## Protected Routes
 * - `/cms` and `/cms/*` - Requires authentication AND route permission
 * - `/login` and `/login/*` - Redirects authenticated users to `/cms`
 *
 * ## RBAC (Role-Based Access Control)
 * After authentication, the guard checks if the user has the required permission
 * for the target route. If not, it returns the permission that was denied so
 * the router can render an Unauthorized component instead of redirecting.
 *
 * ## Important Behavior
 * - The `ctx.replace` property is **mutated** to `true` for all protected routes.
 *   This ensures auth redirects don't pollute browser history.
 * - If `isAuthenticated()` throws, the user is redirected to `/login` as a fallback.
 */
export class AuthGuard {
  /**
   * Checks if the user can navigate to the given pathname.
   *
   * @param pathname - The target pathname
   * @param ctx - Navigation context. **Note:** `ctx.replace` will be mutated to `true`
   *              for protected routes to prevent history pollution during redirects.
   * @returns Object with pathname and optional denied permission
   */
  public async check(pathname: string, ctx: INavigateTo): Promise<AuthGuardResult> {
    const isCms = isProtectedRoute("/cms", pathname);
    const isLogin = isProtectedRoute("/login", pathname);

    // Non-protected routes pass through unchanged
    if (!isCms && !isLogin) {
      return { pathname };
    }

    // For protected routes, always use replace to avoid history pollution
    ctx.replace = true;

    try {
      const { id } = await isAuthenticated();

      // Not authenticated - redirect to login
      if (!id && isCms) {
        return { pathname: "/login" };
      }

      // Authenticated but on login page - redirect to CMS
      if (id && isLogin) {
        return { pathname: "/cms" };
      }

      // Not authenticated and not on CMS
      if (!id) {
        return { pathname: "/login" };
      }

      // ====== RBAC Permission Check ======
      // User is authenticated and trying to access CMS
      // Check if they have the required permission for this route
      const userPermissions = session?.permissions ?? [];

      if (!canAccessRoute(pathname, userPermissions)) {
        const requiredPermission = getRoutePermission(pathname);
        return {
          pathname,
          deniedPermission: requiredPermission ?? "cms.view",
        };
      }

      // All checks passed
      return { pathname };
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.error(error);
      // On auth error, redirect to login instead of root for better UX
      return { pathname: "/login" };
    }
  }
}
