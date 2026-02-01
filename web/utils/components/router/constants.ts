/**
 * Router Constants
 *
 * Centralized constants for the router module.
 * Makes it easy to change routes in one place and enables testing.
 */

// ============================================================================
// Protected Route Prefixes
// ============================================================================

/**
 * Route prefix that requires authentication.
 * Users without a valid session are redirected to LOGIN_ROUTE.
 */
export const PROTECTED_ROUTE = "/cms";

/**
 * Login/authentication route.
 * Authenticated users are redirected away from this route.
 */
export const LOGIN_ROUTE = "/login";

/**
 * Default route for authenticated users.
 * Used as fallback when redirecting from login or on auth errors.
 */
export const DEFAULT_AUTHENTICATED_ROUTE = "/cms";

/**
 * Default permission required for CMS access.
 * Used when a specific route permission cannot be determined.
 */
export const DEFAULT_CMS_PERMISSION = "cms.view";
