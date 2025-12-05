import { isAuthenticated } from "@agape/security/access";
import type { INavigateTo } from "./types";

// Re-export for backwards compatibility
export type { INavigateTo };

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
 * Authentication guard that controls access to protected routes.
 *
 * ## Protected Routes
 * - `/cms` and `/cms/*` - Requires authentication
 * - `/login` and `/login/*` - Redirects authenticated users to `/cms`
 *
 * ## Important Behavior
 * - The `ctx.replace` property is **mutated** to `true` for all protected routes.
 *   This ensures auth redirects don't pollute browser history.
 * - If `isAuthenticated()` throws, the user is redirected to `/` as a fallback.
 */
export class AuthGuard {
  /**
   * Checks if the user can navigate to the given pathname.
   *
   * @param pathname - The target pathname
   * @param ctx - Navigation context. **Note:** `ctx.replace` will be mutated to `true`
   *              for protected routes to prevent history pollution during redirects.
   * @returns The pathname to navigate to (may be different if redirect is needed)
   */
  public async check(pathname: string, ctx: INavigateTo): Promise<string> {
    const isCms = isProtectedRoute("/cms", pathname);
    const isLogin = isProtectedRoute("/login", pathname);

    // Non-protected routes pass through unchanged
    if (!isCms && !isLogin) {
      return pathname;
    }

    // For protected routes, always use replace to avoid history pollution
    ctx.replace = true;

    try {
      const { id } = await isAuthenticated();

      if (id && isCms) return pathname;
      if (!id && isCms) return "/login";
      if (id && isLogin) return "/cms";
      return "/login";
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.error(error);
      // On auth error, redirect to login instead of root for better UX
      return "/login";
    }
  }
}
