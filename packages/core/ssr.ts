/**
 * Shared SSR/SSG types and constants.
 *
 * Used by both server (entry-server, middleware) and client (entry-client).
 */

/** Rendering mode for page components */
export type RenderingMode = "spa" | "ssr" | "ssg";

/** Data serialized into the HTML for client hydration */
export interface SSRPageData {
  /** The matched route pathname */
  pathname: string;
  /** Extracted route parameters */
  params: Record<string, string>;
  /** Server-provided props (must be JSON-serializable) */
  props: Record<string, unknown>;
}

/** ID of the script tag containing SSR data */
export const SSR_DATA_ID = "__SSR_DATA__";

/** HTML placeholder replaced with rendered content */
export const SSR_OUTLET = "<!--ssr-outlet-->";

/** HTML placeholder replaced with SSR data script tag */
export const SSR_DATA_PLACEHOLDER = "<!--ssr-data-->";
