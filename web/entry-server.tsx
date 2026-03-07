/**
 * SSR/SSG Server Entry Point
 *
 * Provides server-side rendering capabilities for pages that opt-in
 * via `export const rendering = "ssr" | "ssg"`.
 *
 * This module is built by Vite with `--ssr` flag and runs on Node.js.
 * It eagerly imports all page and layout modules to render them to HTML strings.
 */

import { renderToString } from "react-dom/server";
import { createElement, StrictMode } from "react";
import {
  filePathToPageRoute,
  filePathToLayoutRoute,
  matchPath,
} from "./utils/components/router/path-utils";

// Eagerly import all page and layout modules for server rendering
const pageModules = import.meta.glob("./app/**/page.{ts,tsx}", {
  eager: true,
}) as Record<string, Record<string, unknown>>;

const layoutModules = import.meta.glob("./app/**/_layout.{ts,tsx}", {
  eager: true,
}) as Record<string, Record<string, unknown>>;

// ============================================================================
// Types
// ============================================================================

interface RouteInfo {
  filePath: string;
  pattern: string;
  Component: React.ComponentType<any>;
  rendering?: "ssr" | "ssg";
  getServerSideProps?: (ctx: {
    params: Record<string, string>;
    query: Record<string, string>;
  }) => Promise<Record<string, unknown>>;
  getStaticProps?: (ctx: {
    params: Record<string, string>;
    query: Record<string, string>;
  }) => Promise<Record<string, unknown>>;
}

interface LayoutInfo {
  filePath: string;
  pattern: string;
  Component: React.ComponentType<{ children?: React.ReactNode }>;
}

export interface RenderResult {
  html: string;
  props: Record<string, unknown>;
  pagePath: string;
  layoutPaths: string[];
}

// ============================================================================
// Route and Layout Maps
// ============================================================================

const routes: RouteInfo[] = [];
const layouts: LayoutInfo[] = [];

// Strip "./app" prefix to match the same routes as the client-side router,
// which uses import.meta.glob relative to web/app/
function stripAppPrefix(filePath: string): string {
  return filePath.replace(/^\.\/app\//, "./");
}

for (const [filePath, mod] of Object.entries(pageModules)) {
  const pattern = filePathToPageRoute(stripAppPrefix(filePath));
  routes.push({
    filePath,
    pattern,
    Component: mod.default as React.ComponentType<any>,
    rendering: mod.rendering as RouteInfo["rendering"],
    getServerSideProps: mod.getServerSideProps as RouteInfo["getServerSideProps"],
    getStaticProps: mod.getStaticProps as RouteInfo["getStaticProps"],
  });
}

for (const [filePath, mod] of Object.entries(layoutModules)) {
  const pattern = filePathToLayoutRoute(stripAppPrefix(filePath));
  layouts.push({
    filePath,
    pattern,
    Component: (mod.default ??
      (({ children }: { children?: React.ReactNode }) =>
        createElement("div", null, children))) as LayoutInfo["Component"],
  });
}

// ============================================================================
// Route Matching
// ============================================================================

function findRoute(
  pathname: string,
): { route: RouteInfo; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.pattern === pathname) {
      return { route, params: {} };
    }
  }

  for (const route of routes) {
    if (route.pattern.includes(":")) {
      const params = matchPath(route.pattern, pathname);
      if (params) return { route, params };
    }
  }

  return null;
}

function findLayouts(pathname: string): LayoutInfo[] {
  const parts = pathname.split("/").filter(Boolean);
  const paths = ["/"];
  let curr = "";
  for (const p of parts) {
    curr += "/" + p;
    paths.push(curr);
  }

  const found: LayoutInfo[] = [];
  for (const pathToCheck of paths) {
    const exact = layouts.find((l) => l.pattern === pathToCheck);
    if (exact) {
      found.push(exact);
      continue;
    }
    for (const layout of layouts) {
      if (layout.pattern.includes(":") && matchPath(layout.pattern, pathToCheck)) {
        found.push(layout);
        break;
      }
    }
  }

  return found;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Returns a manifest of routes with their rendering modes.
 * Used by the Express server to know which routes need SSR/SSG.
 */
export function getManifest(): Record<string, { rendering: "ssr" | "ssg" }> {
  const manifest: Record<string, { rendering: "ssr" | "ssg" }> = {};
  for (const route of routes) {
    if (route.rendering) {
      manifest[route.pattern] = { rendering: route.rendering };
    }
  }
  return manifest;
}

/**
 * Returns a list of static paths that should be pre-rendered at build time.
 * Only includes SSG routes without dynamic parameters.
 */
export function getStaticPaths(): string[] {
  return routes
    .filter((r) => r.rendering === "ssg" && !r.pattern.includes(":"))
    .map((r) => r.pattern);
}

/**
 * Renders a page to an HTML string with its props.
 *
 * @param url - The full URL to render (e.g., "/about?foo=bar")
 * @returns RenderResult with HTML and serializable data, or null if not an SSR/SSG route
 */
export async function render(url: string): Promise<RenderResult | null> {
  const urlObj = new URL(url, "http://localhost");
  const pathname = urlObj.pathname;
  const query = Object.fromEntries(urlObj.searchParams);

  const match = findRoute(pathname);
  if (!match || !match.route.rendering) return null;

  const { route, params } = match;

  // Get server-side props
  let props: Record<string, unknown> = {};
  if (route.rendering === "ssr" && route.getServerSideProps) {
    props = await route.getServerSideProps({ params, query });
  } else if (route.rendering === "ssg" && route.getStaticProps) {
    props = await route.getStaticProps({ params, query });
  }

  // Build component tree: page wrapped with layouts (root -> innermost)
  const allProps = { ...props, params };
  let element = createElement(route.Component, allProps);

  const matchedLayouts = findLayouts(pathname);
  for (let i = matchedLayouts.length - 1; i >= 0; i--) {
    element = createElement(matchedLayouts[i].Component, null, element);
  }

  const html = renderToString(createElement(StrictMode, null, element));

  return {
    html,
    props: allProps,
    pagePath: route.filePath,
    layoutPaths: matchedLayouts.map((l) => l.filePath),
  };
}
