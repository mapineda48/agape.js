/**
 * SSR/SSG Client Hydration
 *
 * Hydrates server-rendered HTML by loading the matching page and layout
 * components, rebuilding the same React tree, and attaching event handlers.
 */

import { StrictMode, createElement } from "react";
import { hydrateRoot } from "react-dom/client";

interface SSRData {
  props: Record<string, unknown>;
  pagePath: string;
  layoutPaths: string[];
}

// Globs relative to web/ssr/ — keys will be like "../app/ssr/page.tsx"
const pageModules = import.meta.glob("../app/**/page.{ts,tsx}");
const layoutModules = import.meta.glob("../app/**/_layout.{ts,tsx}");

/**
 * Converts a server pagePath (relative to web/, e.g. "./app/ssr/page.tsx")
 * to a glob key (relative to web/ssr/, e.g. "../app/ssr/page.tsx")
 */
function toGlobKey(serverPath: string): string {
  return serverPath.replace(/^\.\//, "../");
}

export async function hydrate(
  container: HTMLElement,
  ssrData: SSRData,
): Promise<void> {
  // Load the page module
  const pageGlobKey = toGlobKey(ssrData.pagePath);
  const pageLoader = pageModules[pageGlobKey];
  if (!pageLoader) {
    console.error(
      `[SSR Hydrate] Page module not found: ${ssrData.pagePath} (glob key: ${pageGlobKey})`,
    );
    return;
  }

  const pageModule: any = await pageLoader();
  const Page = pageModule.default;

  // Load layout modules in order
  const layoutComponents: React.ComponentType<{
    children?: React.ReactNode;
  }>[] = [];
  for (const layoutPath of ssrData.layoutPaths) {
    const layoutGlobKey = toGlobKey(layoutPath);
    const layoutLoader = layoutModules[layoutGlobKey];
    if (!layoutLoader) continue;

    const layoutModule: any = await layoutLoader();
    layoutComponents.push(
      layoutModule.default ??
        (({ children }: { children?: React.ReactNode }) =>
          createElement("div", null, children)),
    );
  }

  // Build the same element tree as the server (root layout -> innermost -> page)
  let element: React.ReactElement = createElement(Page, ssrData.props);
  for (let i = layoutComponents.length - 1; i >= 0; i--) {
    element = createElement(layoutComponents[i], null, element);
  }

  hydrateRoot(container, createElement(StrictMode, null, element));
}
