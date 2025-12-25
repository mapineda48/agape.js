import { type JSX, useEffect, useMemo, useState } from "react";
import { HistoryManager, HistoryContext } from "../components/router/router";
import ErrorBoundary from "../components/util/error-boundary";
import Chat from "../components/Chat";

/**
 * Routes component for React apps. Subscribes to router events
 * and updates local state with the current page element.
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
      <Chat />
    </HistoryContext.Provider>
  );
}
