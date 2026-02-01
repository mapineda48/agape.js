/**
 * Store Hooks for Form State Management
 *
 * This module provides React hooks for accessing and manipulating form state.
 * It uses Zustand internally but maintains API compatibility with the previous
 * Redux-based implementation.
 *
 * @module store/hooks
 */

import { useMemo } from "react";
import { useStore } from "zustand";
import {
  useFormStoreApi,
  useSelectPath as useZustandSelectPath,
  useFormActions,
} from "./zustand-provider";
import type { Path } from "./zustand";

// Re-export Path type for backward compatibility
export type { Path } from "./zustand";

/**
 * Hook to get a dispatch-like function for backward compatibility.
 * Returns an object with action methods that mirror the old Redux actions.
 *
 * @deprecated Use useFormActions() directly for cleaner code
 * @returns An object with dispatch-like methods
 */
export function useAppDispatch() {
  const actions = useFormActions();
  const store = useFormStoreApi();

  // Return a dispatch function that handles action-like objects
  // This maintains compatibility with existing code that uses:
  // dispatch(setAtPath({ path, value }))
  return useMemo(() => {
    const dispatch = (action: {
      type?: string;
      payload?: any;
    }) => {
      // Handle legacy action format
      if (action.type === "dict/setAtPath" || (action as any).path !== undefined) {
        const payload = action.payload || action;
        actions.setAtPath(payload.path, payload.value);
        return;
      }

      if (action.type === "dict/pushAtPath") {
        actions.pushAtPath(action.payload.path, action.payload.value);
        return;
      }

      if (action.type === "dict/removeAtPath") {
        actions.removeAtPath(action.payload.path, action.payload.index);
        return;
      }

      if (action.type === "dict/deleteAtPath") {
        actions.deleteAtPath(action.payload.path);
        return;
      }

      if (action.type === "dict/resetState") {
        actions.resetState(action.payload.state);
        return;
      }

      // For direct action calls
      console.warn("Unknown action type:", action);
    };

    return dispatch;
  }, [actions, store]);
}

/**
 * Hook to select a value at a specific path in the form store.
 * Automatically clones the value to prevent mutation.
 *
 * @param path - The path to the value in the form state
 * @param fallback - Optional fallback value if path doesn't exist
 * @returns The value at the path (or fallback)
 *
 * @example
 * ```tsx
 * const name = useSelectPath<string>(['user', 'name'], '');
 * const user = useSelectPath<User>(['user']);
 * ```
 */
export function useSelectPath<T = unknown>(path: Path, fallback?: T): T {
  return useZustandSelectPath<T>(path, fallback);
}

/**
 * Typed selector hook - kept for API compatibility with Redux-style selectors.
 * This hook is REACTIVE - it will re-render when the selected data changes.
 *
 * @deprecated Prefer useSelectPath for path-based selection
 */
export function useAppSelector<T>(selector: (state: { form: { data: any } }) => T): T {
  const store = useFormStoreApi();
  
  // Use Zustand's useStore to make this reactive
  const data = useStore(store, (state) => state.data);
  
  // Run selector with a Redux-like state shape for compatibility
  return selector({ form: { data } });
}
