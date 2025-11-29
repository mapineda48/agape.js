/**
 * Router type definitions
 */

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
