/**
 * Authentication and Authorization Guard
 *
 * Controls access to protected routes with support for:
 * - Authentication checks (is user logged in?)
 * - RBAC authorization (does user have required permission?)
 *
 * ## Design for Testability
 *
 * The AuthGuard uses dependency injection for external services:
 * - `authService`: Provides authentication state
 * - `permissionService`: Provides permission checking
 *
 * This allows easy mocking in tests without coupling to global state.
 *
 * ## Protected Routes
 * - `/cms` and `/cms/*` - Requires authentication AND route permission
 * - `/login` and `/login/*` - Redirects authenticated users to `/cms`
 */

import type { INavigateTo } from "./types";
import { isProtectedRoute } from "./path-utils";
import {
  PROTECTED_ROUTE,
  LOGIN_ROUTE,
  DEFAULT_AUTHENTICATED_ROUTE,
  DEFAULT_CMS_PERMISSION,
} from "./constants";

// Re-export for backwards compatibility
export type { INavigateTo };

// ============================================================================
// Interfaces for Dependency Injection
// ============================================================================

/**
 * Authentication service interface.
 * Implement this to provide custom authentication logic.
 */
export interface IAuthService {
  /**
   * Checks if the current user is authenticated.
   * @returns User info with at least an `id`, or null/undefined if not authenticated
   */
  isAuthenticated(): Promise<{ id?: string | number } | null | undefined>;
}

/**
 * Permission service interface.
 * Implement this to provide custom permission checking.
 */
export interface IPermissionService {
  /**
   * Gets the user's current permissions.
   */
  getPermissions(): string[];

  /**
   * Checks if the user can access a specific route.
   * @param pathname - The route to check
   * @param permissions - User's permissions
   */
  canAccessRoute(pathname: string, permissions: string[]): boolean;

  /**
   * Gets the required permission for a route.
   * @param pathname - The route to check
   */
  getRoutePermission(pathname: string): string | null;
}

/**
 * Configuration for AuthGuard.
 */
export interface AuthGuardConfig {
  /**
   * Route prefix that requires authentication.
   * @default "/cms"
   */
  protectedRoute?: string;

  /**
   * Login route. Authenticated users are redirected away.
   * @default "/login"
   */
  loginRoute?: string;

  /**
   * Default route for authenticated users.
   * @default "/cms"
   */
  defaultAuthenticatedRoute?: string;

  /**
   * Default permission when route permission cannot be determined.
   * @default "cms.view"
   */
  defaultPermission?: string;
}

// ============================================================================
// AuthGuard Result Types
// ============================================================================

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

// ============================================================================
// AuthGuard Implementation
// ============================================================================

/**
 * Authentication and authorization guard that controls access to protected routes.
 *
 * @example
 * ```ts
 * // Default usage with imported services
 * const guard = new AuthGuard(authService, permissionService);
 *
 * // With custom config
 * const guard = new AuthGuard(authService, permissionService, {
 *   protectedRoute: '/admin',
 *   loginRoute: '/auth/login',
 * });
 *
 * // In tests with mocks
 * const mockAuth = { isAuthenticated: async () => ({ id: '123' }) };
 * const mockPerms = { ... };
 * const guard = new AuthGuard(mockAuth, mockPerms);
 * ```
 */
export class AuthGuard {
  private readonly config: Required<AuthGuardConfig>;
  private readonly authService: IAuthService;
  private readonly permissionService: IPermissionService;

  constructor(
    authService: IAuthService,
    permissionService: IPermissionService,
    config: AuthGuardConfig = {},
  ) {
    this.authService = authService;
    this.permissionService = permissionService;
    this.config = {
      protectedRoute: config.protectedRoute ?? PROTECTED_ROUTE,
      loginRoute: config.loginRoute ?? LOGIN_ROUTE,
      defaultAuthenticatedRoute:
        config.defaultAuthenticatedRoute ?? DEFAULT_AUTHENTICATED_ROUTE,
      defaultPermission: config.defaultPermission ?? DEFAULT_CMS_PERMISSION,
    };
  }

  /**
   * Checks if the user can navigate to the given pathname.
   *
   * @param pathname - The target pathname
   * @param ctx - Navigation context. **Note:** `ctx.replace` will be mutated to `true`
   *              for protected routes to prevent history pollution during redirects.
   * @returns Object with pathname and optional denied permission
   */
  public async check(
    pathname: string,
    ctx: INavigateTo,
  ): Promise<AuthGuardResult> {
    const { protectedRoute, loginRoute, defaultAuthenticatedRoute } =
      this.config;

    const isProtected = isProtectedRoute(protectedRoute, pathname);
    const isLogin = isProtectedRoute(loginRoute, pathname);

    // Non-protected routes pass through unchanged
    if (!isProtected && !isLogin) {
      return { pathname };
    }

    // For protected routes, always use replace to avoid history pollution
    ctx.replace = true;

    try {
      const authResult = await this.authService.isAuthenticated();
      const userId = authResult?.id;

      // Not authenticated - redirect to login
      if (!userId && isProtected) {
        return { pathname: loginRoute };
      }

      // Authenticated but on login page - redirect to default route
      if (userId && isLogin) {
        return { pathname: defaultAuthenticatedRoute };
      }

      // Not authenticated and not on protected route
      if (!userId) {
        return { pathname: loginRoute };
      }

      // ====== RBAC Permission Check ======
      // User is authenticated and trying to access protected route
      return this.checkPermissions(pathname);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("AuthGuard error:", error);
      }
      // On auth error, redirect to login instead of root for better UX
      return { pathname: loginRoute };
    }
  }

  /**
   * Checks if the authenticated user has permission to access the route.
   * @internal
   */
  private checkPermissions(pathname: string): AuthGuardResult {
    const userPermissions = this.permissionService.getPermissions();

    if (!this.permissionService.canAccessRoute(pathname, userPermissions)) {
      const requiredPermission =
        this.permissionService.getRoutePermission(pathname);
      return {
        pathname,
        deniedPermission: requiredPermission ?? this.config.defaultPermission,
      };
    }

    // All checks passed
    return { pathname };
  }
}

// ============================================================================
// Default Services Factory
// ============================================================================

/**
 * Creates an AuthGuard with the default application services.
 * This is a convenience factory for production use.
 */
export function createDefaultAuthGuard(
  config?: AuthGuardConfig,
): Promise<AuthGuard> {
  // Dynamic imports to avoid circular dependencies and enable tree-shaking
  return Promise.all([
    import("#services/security/session"),
    import("#web/utils/rbca"),
  ]).then(([sessionModule, rbacModule]) => {
    const authService: IAuthService = {
      isAuthenticated: sessionModule.isAuthenticated,
    };

    const permissionService: IPermissionService = {
      getPermissions: () => sessionModule.session?.permissions ?? [],
      canAccessRoute: rbacModule.canAccessRoute,
      getRoutePermission: rbacModule.getRoutePermission,
    };

    return new AuthGuard(authService, permissionService, config);
  });
}
