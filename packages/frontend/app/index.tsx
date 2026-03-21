import { type JSX, Suspense, useEffect, useMemo, useState } from "react";
import HistoryManager from "#web/utils/components/router/HistoryManager";
import HistoryContext from "#web/utils/components/router/HistoryContext";
import ErrorBoundary from "#web/utils/components/error-boundary";
import type { SSRPageData } from "#shared/ssr";

/**
 * Default loading fallback shown while lazy-loaded page chunks are being fetched.
 * Kept minimal to avoid layout shift; replace with a branded spinner as needed.
 */
function PageLoadingFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "200px",
      }}
    >
      <p>Loading...</p>
    </div>
  );
}

/**
 * Routes component for React apps. Subscribes to router events
 * and updates local state with the current page element.
 *
 * Page modules are code-split via `import.meta.glob` (Vite lazy loaders).
 * Each page is loaded on demand when navigated to, producing separate chunks
 * in the production build. A `Suspense` boundary wraps the page content so
 * any nested `React.lazy()` components also get a proper loading fallback.
 *
 * SSR/SSG pages are NOT affected by client-side lazy loading — the server
 * entry (`entry-server.tsx`) has its own eager loading mechanism.
 *
 * Note: Global UI components (Chat, CartDrawer) are now rendered
 * in the root layout (_layout.tsx), not here.
 */
export default function Routes({ ssrData }: { ssrData?: SSRPageData | null }) {
  const [state, setState] = useState<null | JSX.Element>(null);

  const router = useMemo(() => {
    const pageModules = import.meta.glob<unknown>("./**/page.{ts,tsx}");
    const layoutModules = import.meta.glob<unknown>("./**/_layout.{ts,tsx}");

    return new HistoryManager(pageModules, layoutModules);
  }, []);

  // Start listening for route changes
  useEffect(() => router.listenPage(setState, ssrData ?? undefined), [router, ssrData]);

  // Render the current page, or a loading fallback until the first route resolves.
  // Suspense catches any nested React.lazy() boundaries within page components.
  return (
    <HistoryContext.Provider value={router}>
      <ErrorBoundary>
        <Suspense fallback={<PageLoadingFallback />}>
          {state ?? <PageLoadingFallback />}
        </Suspense>
      </ErrorBoundary>
    </HistoryContext.Provider>
  );
}
