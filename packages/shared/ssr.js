/**
 * Shared SSR/SSG types and constants.
 *
 * Used by both server (entry-server, middleware) and client (entry-client).
 */
/** ID of the script tag containing SSR data */
export const SSR_DATA_ID = "__SSR_DATA__";
/** HTML placeholder replaced with rendered content */
export const SSR_OUTLET = "<!--ssr-outlet-->";
/** HTML placeholder replaced with SSR data script tag */
export const SSR_DATA_PLACEHOLDER = "<!--ssr-data-->";
