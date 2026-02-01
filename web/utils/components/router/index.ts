/**
 * Router Module - Barrel Exports
 *
 * Centralized exports for the router module.
 * Import from this file for cleaner imports in consuming code.
 *
 * @example
 * ```ts
 * import { useRouter, HistoryManager, matchPath } from '#web/utils/components/router';
 * ```
 */

// ============================================================================
// Main Components & Hooks
// ============================================================================

export { useRouter } from "./hook";
export { useHistory } from "./HistoryContext";
export { default as HistoryManager } from "./HistoryManager";
export type { HistoryManagerOptions } from "./HistoryManager";

// ============================================================================
// Context Providers
// ============================================================================

export { default as HistoryContext } from "./HistoryContext";
export { RouterPathContext, RouterPathProvider } from "./path-context";

// ============================================================================
// Guards
// ============================================================================

export {
  AuthGuard,
  createDefaultAuthGuard,
  type IAuthService,
  type IPermissionService,
  type AuthGuardConfig,
  type AuthGuardResult,
} from "./auth-guard";

// ============================================================================
// Registry
// ============================================================================

export {
  RouteRegistry,
  type ModuleType,
  type IPage,
  type ILayout,
  type IRoute,
  type ILayouts,
} from "./registry";

// ============================================================================
// Navigation
// ============================================================================

export { Navigator } from "./navigator";

// ============================================================================
// Path Utilities
// ============================================================================

export {
  matchPath,
  isProtectedRoute,
  normalizeSegment,
  toRelativePath,
  parsePathname,
  filePathToPageRoute,
  filePathToLayoutRoute,
} from "./path-utils";

// ============================================================================
// Constants
// ============================================================================

export {
  PROTECTED_ROUTE,
  LOGIN_ROUTE,
  DEFAULT_AUTHENTICATED_ROUTE,
  DEFAULT_CMS_PERMISSION,
} from "./constants";

// ============================================================================
// Types
// ============================================================================

export type {
  INavigateTo,
  RouteParams,
  PageProps,
  MatchResult,
  LayoutMatch,
} from "./types";
