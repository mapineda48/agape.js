/**
 * Path Utility Functions for Router
 *
 * Pure functions for path matching, conversion, and manipulation.
 * Extracted for easy testing and reuse across the router module.
 */

import type { RouteParams } from "./types";

// ============================================================================
// Path Matching
// ============================================================================

/**
 * Matches a pathname against a route pattern and extracts parameters.
 * Pattern uses :param syntax for dynamic segments.
 *
 * @param pattern - Route pattern with optional :param segments
 * @param pathname - Actual pathname to match against
 * @returns Extracted params object, or null if no match
 *
 * @example
 * matchPath('/users/:id', '/users/123')
 * // { id: '123' }
 *
 * matchPath('/posts/:postId/comments/:commentId', '/posts/42/comments/99')
 * // { postId: '42', commentId: '99' }
 *
 * matchPath('/users/:id', '/posts/123')
 * // null (no match)
 *
 * matchPath('/users', '/users')
 * // {} (match with no params)
 */
export function matchPath(
  pattern: string,
  pathname: string,
): RouteParams | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathnameParts = pathname.split("/").filter(Boolean);

  // Must have same number of segments
  if (patternParts.length !== pathnameParts.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathnamePart = pathnameParts[i];

    // Dynamic segment - extract param
    if (patternPart.startsWith(":")) {
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathnamePart);
    }
    // Static segment - must match exactly
    else if (patternPart !== pathnamePart) {
      return null;
    }
  }

  return params;
}

/**
 * Checks if a pathname matches a protected route prefix.
 * Uses strict matching: exact match OR prefix followed by '/'.
 *
 * @param prefix - Route prefix to check against (e.g., "/cms")
 * @param pathname - Pathname to check
 * @returns true if pathname matches the prefix
 *
 * @example
 * isProtectedRoute("/cms", "/cms")           // true
 * isProtectedRoute("/cms", "/cms/dashboard") // true
 * isProtectedRoute("/cms", "/cms-other")     // false - strict matching!
 */
export function isProtectedRoute(prefix: string, pathname: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

// ============================================================================
// Path Conversion
// ============================================================================

/**
 * Normalizes a path segment: lowercases static segments but preserves
 * parameter names with their original casing.
 *
 * @param segment - Path segment to normalize
 * @returns Normalized segment
 *
 * @example
 * normalizeSegment("Users")   // "users"
 * normalizeSegment(":postId") // ":postId" (preserved!)
 */
export function normalizeSegment(segment: string): string {
  if (segment.startsWith(":")) {
    return segment; // Keep param names as-is
  }
  return segment.toLowerCase();
}

/**
 * Converts an absolute path to a relative path based on a base path context.
 *
 * This helper is used internally to display relative paths to components within
 * a specific layout context, making the `pathname` value more intuitive for
 * nested layouts.
 *
 * @param absolutePath - The full absolute pathname (e.g., "/cms/inventory/products")
 * @param basePath - The base path context from RouterPathProvider (e.g., "/cms")
 * @returns The relative portion of the path, or the absolute path if not within the base context
 *
 * @example
 * toRelativePath("/cms/inventory/products", "/cms")
 * // Returns: "inventory/products"
 *
 * toRelativePath("/cms/inventory", "/cms")
 * // Returns: "inventory"
 *
 * toRelativePath("/other/path", "/cms")
 * // Returns: "/other/path" (not within base context)
 *
 * toRelativePath("/cms", "/cms")
 * // Returns: "/" (exactly at base path)
 */
export function toRelativePath(absolutePath: string, basePath: string): string {
  // If not within our base path context, return the absolute path
  if (!absolutePath.startsWith(basePath)) {
    return absolutePath;
  }

  // Remove the base path prefix
  const relativePart = absolutePath.slice(basePath.length);

  // Remove leading slash if present
  return relativePart.startsWith("/")
    ? relativePart.slice(1)
    : relativePart || "/"; // Return "/" if we're exactly at the base path
}

// ============================================================================
// Path Parsing
// ============================================================================

/**
 * Parses a pathname string into clean path and query parameters.
 * Uses a dummy base URL to handle relative paths.
 *
 * @param pathname - Pathname string, possibly with query string
 * @returns Object with cleanPath and query params
 *
 * @example
 * parsePathname("/users/123?tab=profile&active=true")
 * // { cleanPath: "/users/123", query: { tab: "profile", active: "true" } }
 */
export function parsePathname(pathname: string): {
  cleanPath: string;
  query: Record<string, string>;
} {
  const url = new URL(pathname, "http://dummy");
  return {
    cleanPath: url.pathname,
    query: Object.fromEntries(url.searchParams),
  };
}

// ============================================================================
// File Path to Route Conversion
// ============================================================================

/**
 * Converts a page file path to a route pathname.
 *
 * @param filename - File path like './foo/bar/page.tsx'
 * @returns Route pathname like '/foo/bar'
 *
 * @example
 * filePathToPageRoute('./foo/bar/page.tsx')      // '/foo/bar'
 * filePathToPageRoute('./users/[id]/page.tsx')   // '/users/:id'
 * filePathToPageRoute('./page.tsx')              // '/'
 */
export function filePathToPageRoute(filename: string): string {
  const path = filename
    .replace(/^\.\//, "/")
    .replace(/\/page\.tsx?$/, "")
    // Convert [param] to :param (preserving param name casing)
    .replace(/\[([^\]]+)\]/g, ":$1");

  if (path === "") return "/";

  // Normalize each segment independently
  return path
    .split("/")
    .map((seg) => normalizeSegment(seg))
    .join("/");
}

/**
 * Converts a layout file path to a route pathname.
 *
 * @param filename - File path like './foo/_layout.tsx'
 * @returns Route pathname like '/foo'
 *
 * @example
 * filePathToLayoutRoute('./foo/_layout.tsx')        // '/foo'
 * filePathToLayoutRoute('./users/[id]/_layout.tsx') // '/users/:id'
 * filePathToLayoutRoute('./_layout.tsx')            // '/'
 */
export function filePathToLayoutRoute(filename: string): string {
  const path = filename
    .replace(/^\.\//, "/")
    .replace(/\/_layout\.tsx?$/, "")
    // Convert [param] to :param (preserving param name casing)
    .replace(/\[([^\]]+)\]/g, ":$1");

  if (path === "") return "/";

  // Normalize each segment independently
  return path
    .split("/")
    .map((seg) => normalizeSegment(seg))
    .join("/");
}
