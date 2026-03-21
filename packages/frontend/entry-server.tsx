/**
 * SSR Server Entry Point
 *
 * Renders React pages on the server for SSR/SSG routes.
 * Processed by Vite (dev: ssrLoadModule, prod: SSR build).
 */

import { createElement, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import {
  matchPath,
  filePathToPageRoute,
  filePathToLayoutRoute,
} from "#web/utils/components/router/path-utils";
import { RouterPathProvider } from "#web/utils/components/router/path-context";
import HistoryContext from "#web/utils/components/router/HistoryContext";
import type HistoryManager from "#web/utils/components/router/HistoryManager";
import type { RenderingMode, SSRPageData } from "#shared/ssr";

// Lazy-load page and layout modules (resolved by Vite at build time)
// Using lazy loading so SPA-only pages (with #services/* imports) are never
// loaded on the server, avoiding missing module errors in production.
const rawPageLoaders = import.meta.glob<Record<string, unknown>>(
  "./app/**/page.{ts,tsx}",
);

const rawLayoutLoaders = import.meta.glob<Record<string, unknown>>(
  "./app/**/_layout.{ts,tsx}",
);

// Normalize keys: "./app/foo/page.tsx" → "./foo/page.tsx"
function stripAppPrefix<T>(modules: Record<string, T>) {
  const result: Record<string, T> = {};
  for (const [key, value] of Object.entries(modules)) {
    result[key.replace("./app/", "./")] = value;
  }
  return result;
}

const pageLoaders = stripAppPrefix(rawPageLoaders);
const layoutLoaders = stripAppPrefix(rawLayoutLoaders);

// Cache loaded modules to avoid re-importing
const pageModuleCache = new Map<string, Record<string, unknown>>();
const layoutModuleCache = new Map<string, Record<string, unknown>>();

async function loadPageModule(filePath: string): Promise<Record<string, unknown> | null> {
  if (pageModuleCache.has(filePath)) return pageModuleCache.get(filePath)!;
  const loader = pageLoaders[filePath];
  if (!loader) return null;
  try {
    const mod = await loader();
    pageModuleCache.set(filePath, mod);
    return mod;
  } catch {
    return null;
  }
}

async function loadLayoutModule(filePath: string): Promise<Record<string, unknown> | null> {
  if (layoutModuleCache.has(filePath)) return layoutModuleCache.get(filePath)!;
  const loader = layoutLoaders[filePath];
  if (!loader) return null;
  try {
    const mod = await loader();
    layoutModuleCache.set(filePath, mod);
    return mod;
  } catch {
    return null;
  }
}

// ============================================================================
// Route Matching
// ============================================================================

interface PageMatch {
  filePath: string;
  params: Record<string, string>;
  pattern: string;
}

interface LayoutMatch {
  module: Record<string, unknown>;
  concretePath: string;
}

function findPageFilePath(pathname: string): PageMatch | null {
  for (const filePath of Object.keys(pageLoaders)) {
    const pattern = filePathToPageRoute(filePath);
    const params = matchPath(pattern, pathname);
    if (params !== null) {
      return { filePath, params, pattern };
    }
  }
  return null;
}

async function findLayouts(pathname: string): Promise<LayoutMatch[]> {
  const results: LayoutMatch[] = [];
  const parts = pathname.split("/").filter(Boolean);
  const paths = ["/"];
  let curr = "";
  for (const p of parts) {
    curr += "/" + p;
    paths.push(curr);
  }

  for (const pathToCheck of paths) {
    for (const filePath of Object.keys(layoutLoaders)) {
      const pattern = filePathToLayoutRoute(filePath);
      const params = matchPath(pattern, pathToCheck);
      if (params !== null) {
        const mod = await loadLayoutModule(filePath);
        if (mod) {
          results.push({ module: mod, concretePath: pathToCheck });
        }
        break;
      }
    }
  }

  return results;
}

// ============================================================================
// Element Tree Building
// ============================================================================

function buildElementTree(
  Component: React.ComponentType<Record<string, unknown>>,
  layouts: LayoutMatch[],
  props: Record<string, unknown>,
): React.ReactElement {
  let element = createElement(Component, props);

  // Wrap with layouts (root → innermost), same logic as HistoryManager.wrapWithLayouts
  // Check for root layouts (innermost root: true wins)
  let rootIndex = 0;
  for (let i = layouts.length - 1; i >= 0; i--) {
    const mod = layouts[i].module;
    if (mod.root) {
      rootIndex = i;
      break;
    }
  }

  for (let i = layouts.length - 1; i >= rootIndex; i--) {
    const { module: mod, concretePath } = layouts[i];
    const LayoutComponent = mod.default as React.ComponentType<{
      children?: React.ReactNode;
    }>;
    if (LayoutComponent) {
      const layoutElement = createElement(LayoutComponent, null, element);
      element = createElement(
        RouterPathProvider,
        { path: concretePath },
        layoutElement,
      );
    }
  }

  return element;
}

// ============================================================================
// Render Function
// ============================================================================

export interface SSRRenderResult {
  html: string;
  ssrData: SSRPageData;
}

/**
 * Renders a page for the given URL if it's an SSR/SSG page.
 * Returns null if the page is SPA-only or not found.
 */
export async function render(
  url: string,
  req?: unknown,
): Promise<SSRRenderResult | null> {
  const urlObj = new URL(url, "http://localhost");
  const pathname = urlObj.pathname;
  const query = Object.fromEntries(urlObj.searchParams);

  // Find matching page file
  const match = findPageFilePath(pathname);
  if (!match) return null;

  // Lazy-load the page module
  const mod = await loadPageModule(match.filePath);
  if (!mod) return null;

  const { params } = match;
  const rendering = (mod.rendering as RenderingMode) ?? "spa";

  // Only render SSR/SSG pages
  if (rendering !== "ssr" && rendering !== "ssg") return null;

  const Component = mod.default as React.ComponentType<
    Record<string, unknown>
  >;
  if (!Component) return null;

  // Run getServerProps if available
  let serverProps: Record<string, unknown> = {};
  const getServerProps = mod.getServerProps as
    | ((ctx: {
        params: Record<string, string>;
        query: Record<string, string>;
        req: unknown;
      }) => Promise<Record<string, unknown>>)
    | undefined;

  if (getServerProps) {
    serverProps = await getServerProps({ params, query, req });
  }

  // Build props (merge server props with params)
  const props = { ...serverProps, params };

  // Find and apply layouts
  const layouts = await findLayouts(pathname);

  // Build element tree
  const pageElement = buildElementTree(Component, layouts, props);

  // Create SSR stub for HistoryManager (only pathname/params are read during SSR render)
  const ssrRouterStub = {
    pathname,
    params,
    navigateTo() {},
    listenPath() { return () => {}; },
    listenParams() { return () => {}; },
    listenPage() { return () => {}; },
    navigator: { pathname, history: { location: { search: "" } } },
    registry: {},
    authGuard: {},
  };

  // Wrap with HistoryContext provider so useRouter works during SSR
  const element = createElement(
    HistoryContext.Provider,
    { value: ssrRouterStub as unknown as HistoryManager },
    pageElement,
  );

  // Render to HTML
  const html = renderToString(createElement(StrictMode, null, element));

  const ssrData: SSRPageData = {
    pathname,
    params,
    props: serverProps,
  };

  return { html, ssrData };
}

/**
 * Returns all routes that have SSR/SSG rendering mode.
 * Used for SSG pre-rendering at build time.
 */
export async function getSSRRoutes(): Promise<Array<{
  pathname: string;
  rendering: RenderingMode;
  filePath: string;
}>> {
  const routes: Array<{
    pathname: string;
    rendering: RenderingMode;
    filePath: string;
  }> = [];

  for (const filePath of Object.keys(pageLoaders)) {
    const mod = await loadPageModule(filePath);
    if (!mod) continue;
    const rendering = (mod.rendering as RenderingMode) ?? "spa";
    if (rendering === "ssr" || rendering === "ssg") {
      routes.push({
        pathname: filePathToPageRoute(filePath),
        rendering,
        filePath,
      });
    }
  }

  return routes;
}
