/**
 * Router type definitions
 */

/** Navigation options for router.navigateTo and useRouter.navigate */
export interface INavigateTo {
  /** If true, replaces the current history entry instead of pushing a new one */
  replace?: boolean;
  /** State object to pass to the new route */
  state?: Record<string, unknown>;
}

/** Route parameters extracted from URL patterns */
export type RouteParams = Record<string, string>;

/** Props passed to page components */
export interface PageProps {
  params?: RouteParams;
  [key: string]: unknown;
}

/** Result of matching a URL against a route pattern */
export interface MatchResult {
  params: RouteParams;
  pattern: string;
}

/**
 * Result of matching a layout path.
 * Used to properly set RouterPathProvider context for dynamic layouts.
 */
export interface LayoutMatch {
  /** The pattern used to look up the layout (e.g., "/users/:id") */
  pattern: string;
  /** The concrete path to use as context (e.g., "/users/123") */
  concretePath: string;
}
