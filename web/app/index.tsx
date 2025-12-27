import { type JSX, useEffect, useMemo, useState } from "react";
import { HistoryManager, HistoryContext } from "../components/router/router";
import ErrorBoundary from "../components/util/error-boundary";

/**
 * Routes component for React apps. Subscribes to router events
 * and updates local state with the current page element.
 * 
 * Note: Global UI components (Chat, CartDrawer) are now rendered
 * in the root layout (_layout.tsx), not here.
 */
export default function Routes() {
  const [state, setState] = useState<null | JSX.Element>(null);

  const router = useMemo(() => {
    const pageModules = import.meta.glob<unknown>("./**/page.{ts,tsx}");
    const layoutModules = import.meta.glob<unknown>("./**/_layout.{ts,tsx}");

    return new HistoryManager(pageModules, layoutModules);
  }, []);

  // Start listening for route changes
  useEffect(() => router.listenPage(setState), []);

  // Render the current page, or null until first route executes
  return (
    <HistoryContext.Provider value={router}>
      <ErrorBoundary>{state}</ErrorBoundary>
    </HistoryContext.Provider>
  );
}
