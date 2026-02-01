/**
 * Zustand-based Store Provider for Forms
 *
 * This module provides a React Context-based provider for the Zustand form store.
 * Each Form.Root component gets its own isolated store instance.
 *
 * @module store/zustand-provider
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import {
  createFormStore,
  getByPath,
  type FormStore,
  type FormStoreApi,
  type Path,
} from "./zustand";
import { deepCloneWithOutHelpers } from "#web/utils/clone";

// ============================================================================
// Context
// ============================================================================

const FormStoreContext = createContext<FormStoreApi | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Props for ZustandStoreProvider component.
 */
export interface ZustandStoreProviderProps<T = unknown> {
  children: ReactNode;
  /**
   * Initial state for the form store.
   * Only used on first render - changes to this prop are ignored
   * to avoid losing form state during re-renders.
   */
  initialState?: T;
}

/**
 * ZustandStoreProvider
 *
 * Provides an isolated Zustand store instance for a form.
 * Each form gets its own store, ensuring state isolation.
 *
 * @note The `initialState` only applies on first render. Changing this prop
 * after mount will NOT recreate the store to prevent form state loss.
 */
export function ZustandStoreProvider<T = unknown>({
  children,
  initialState,
}: ZustandStoreProviderProps<T>) {
  // Create store once on mount - initialState is intentionally NOT in dependencies
  const [store] = useState(() => createFormStore(initialState as object));

  return (
    <FormStoreContext.Provider value={store}>
      {children}
    </FormStoreContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to get the raw Zustand store API.
 * Useful for imperative operations like getState().
 *
 * @throws Error if used outside of a ZustandStoreProvider
 */
export function useFormStoreApi(): FormStoreApi {
  const store = useContext(FormStoreContext);
  if (!store) {
    throw new Error(
      "useFormStoreApi must be used within a ZustandStoreProvider (Form.Root)"
    );
  }
  return store;
}

/**
 * Hook to subscribe to a specific path in the form store.
 * Only re-renders when the value at the given path changes.
 *
 * @param path - Path to the value in the form data
 * @param fallback - Optional fallback value if path doesn't exist
 * @returns The value at the path (cloned for safety)
 *
 * @example
 * ```tsx
 * const name = useSelectPath<string>(['user', 'name'], '');
 * ```
 */
export function useSelectPath<T = unknown>(path: Path, fallback?: T): T {
  const store = useFormStoreApi();

  // Use equality function to prevent unnecessary re-renders
  const rawValue = useStoreWithEqualityFn(
    store,
    (state) => getByPath<T>(state.data, path, fallback),
    // Custom equality: compare the serialized values
    (a, b) => {
      // Handle undefined/null cases
      if (a === b) return true;
      if (a == null && b == null) return true;
      if (a == null || b == null) return false;

      // For primitives, direct comparison
      if (typeof a !== "object" && typeof b !== "object") {
        return a === b;
      }

      // Special handling for custom class instances (Decimal, DateTime, etc.)
      // These have custom toString() methods that preserve full precision,
      // unlike toJSON() which may truncate or format differently
      const aConstructor = (a as any).constructor;
      const bConstructor = (b as any).constructor;
      const isCustomClass =
        aConstructor &&
        bConstructor &&
        aConstructor !== Object &&
        aConstructor !== Array &&
        bConstructor !== Object &&
        bConstructor !== Array;

      if (isCustomClass) {
        // Compare using toString() for full precision comparison
        return (a as any).toString() === (b as any).toString();
      }

      // For plain objects/arrays, use JSON comparison for deep equality
      // This is safe because we control what goes into the store
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch {
        return false;
      }
    }
  );

  // Clone to prevent mutation of store data
  return useMemo(() => deepCloneWithOutHelpers(rawValue), [rawValue]);
}

/**
 * Hook to get the form store actions.
 * Does not cause re-renders when store data changes.
 *
 * @returns Object with store action methods
 */
export function useFormActions() {
  const store = useFormStoreApi();

  // Actions are stable - they don't change between renders
  return useMemo(
    () => ({
      setAtPath: (path: Path, value: unknown) =>
        store.getState().setAtPath(path, value),
      pushAtPath: (path: Path, value: unknown) =>
        store.getState().pushAtPath(path, value),
      removeAtPath: (path: Path, indices: number[]) =>
        store.getState().removeAtPath(path, indices),
      deleteAtPath: (path: Path) => store.getState().deleteAtPath(path),
      resetState: (state: unknown) => store.getState().resetState(state),
    }),
    [store]
  );
}

/**
 * Hook to get the entire form state reactively.
 * Use sparingly as it will re-render on any state change.
 *
 * @returns The entire form data object
 */
export function useFormData<T = unknown>(): T {
  const store = useFormStoreApi();
  const rawData = useStore(store, (state) => state.data);
  return useMemo(() => deepCloneWithOutHelpers(rawData) as T, [rawData]);
}

export default ZustandStoreProvider;
