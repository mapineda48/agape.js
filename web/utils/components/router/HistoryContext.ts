import { createContext, useContext } from "react";
import type HistoryManager from "./HistoryManager";

/**
 * Context that holds the parent path for nested layouts.
 * This allows child components to use relative paths.
 */
export const HistoryContext = createContext<HistoryManager | null>(null);

export function useHistory() {
  const ctx = useContext(HistoryContext);

  if (!ctx) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }

  return ctx;
}

export default HistoryContext;
