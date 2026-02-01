/**
 * Zustand-based Form Store
 *
 * This module provides a lightweight replacement for the Redux-based form store.
 * It maintains API compatibility while offering:
 * - ~10x smaller bundle size
 * - Granular subscriptions by path
 * - Simpler mental model
 *
 * @module store/zustand
 */

import { createStore, type StoreApi } from "zustand";
import {
  deepCloneWithHelpersToSerialized,
  deepCloneWithOutHelpers,
} from "#web/utils/clone";

// ============================================================================
// Types
// ============================================================================

export type Path = Array<string | number>;

export interface FormState {
  data: any;
}

export interface FormActions {
  /** Set a value at a specific path */
  setAtPath: (path: Path, value: any) => void;

  /** Push a value to an array at a specific path */
  pushAtPath: (path: Path, value: any) => void;

  /** Remove items at specified indices from an array at a path */
  removeAtPath: (path: Path, indices: number[]) => void;

  /** Delete a value at a path and cleanup empty parents */
  deleteAtPath: (path: Path) => void;

  /** Reset the entire form state */
  resetState: (state: any) => void;
}

export type FormStore = FormState & FormActions;

export type FormStoreApi = StoreApi<FormStore>;

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Get a value at a specific path in an object.
 */
export function getByPath<T = unknown>(
  source: any,
  path: Path,
  fallback?: T
): T {
  let curr = source;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (curr == null || !(key in curr)) return fallback as T;
    curr = curr[key];
  }
  return curr as T;
}

/**
 * Set a value at a specific path in an object (mutates the target).
 */
function setByPath(target: any, path: Path, value: any): void {
  let curr = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (curr[key] === undefined) {
      curr[key] = typeof path[i + 1] === "number" ? [] : {};
    }
    curr = curr[key];
  }
  curr[path[path.length - 1]] = value;
}

/**
 * Recursively deletes a key at the given path and cleans up empty parent containers.
 * Returns true if the container at the current level should be cleaned up (is empty).
 */
function deleteByPathAndCleanup(root: any, path: Path): boolean {
  if (path.length === 0) return false;

  const key = path[0];
  const isLastKey = path.length === 1;

  if (root == null || typeof root !== "object") {
    return false;
  }

  if (!(key in root)) {
    return false;
  }

  if (isLastKey) {
    // Delete the key
    if (Array.isArray(root) && typeof key === "number") {
      root.splice(key, 1);
    } else {
      delete root[key];
    }
  } else {
    // Recurse into the nested object/array
    const shouldCleanup = deleteByPathAndCleanup(root[key], path.slice(1));
    if (shouldCleanup) {
      // Child is now empty, delete it
      if (Array.isArray(root) && typeof key === "number") {
        root.splice(key, 1);
      } else {
        delete root[key];
      }
    }
  }

  // Check if current container is now empty
  if (Array.isArray(root)) {
    return root.length === 0;
  }
  return Object.keys(root).length === 0;
}

// ============================================================================
// Store Factory
// ============================================================================

/**
 * Creates a new Zustand form store instance.
 *
 * @param initialState - Optional initial state for the form
 * @returns A Zustand store API
 *
 * @example
 * ```tsx
 * const store = createFormStore({ name: '', email: '' });
 *
 * // Get current state
 * const state = store.getState();
 *
 * // Set a value
 * state.setAtPath(['name'], 'John');
 *
 * // Subscribe to changes
 * const unsubscribe = store.subscribe((state) => {
 *   console.log('State changed:', state.data);
 * });
 * ```
 */
export function createFormStore(initialState?: object): FormStoreApi {
  return createStore<FormStore>((set, get) => ({
    data: initialState
      ? deepCloneWithHelpersToSerialized(initialState)
      : {},

    setAtPath: (path: Path, value: any) => {
      const serializedValue = deepCloneWithHelpersToSerialized(value);

      set((state) => {
        // Create a shallow copy of data to trigger re-renders
        const newData = { ...state.data };

        if (path.length === 0) {
          // Replace root
          return { data: serializedValue };
        }

        setByPath(newData, path, serializedValue);
        return { data: newData };
      });
    },

    pushAtPath: (path: Path, value: any) => {
      const serializedValue = deepCloneWithHelpersToSerialized(value);

      set((state) => {
        const newData = { ...state.data };

        if (path.length === 0) {
          // Work on root array
          if (!Array.isArray(newData)) {
            return { data: [serializedValue] };
          }
          return { data: [...newData, serializedValue] };
        }

        // Get or create array at path
        let arr = getByPath<any[]>(newData, path, undefined);

        if (!Array.isArray(arr)) {
          arr = [];
          setByPath(newData, path, arr);
        } else {
          // Clone the array to maintain immutability
          arr = [...arr];
          setByPath(newData, path, arr);
        }

        arr.push(serializedValue);
        return { data: newData };
      });
    },

    removeAtPath: (path: Path, indices: number[]) => {
      set((state) => {
        const newData = { ...state.data };

        const arr =
          path.length === 0
            ? newData
            : getByPath<any[]>(newData, path, []);

        if (!Array.isArray(arr)) {
          return state;
        }

        // Clone the array
        const newArr = [...arr];

        // Sort indices in descending order to avoid shifting issues
        const sortedIndices = [...indices].sort((a, b) => b - a);
        for (const idx of sortedIndices) {
          if (idx >= 0 && idx < newArr.length) {
            newArr.splice(idx, 1);
          }
        }

        if (path.length === 0) {
          return { data: newArr };
        }

        setByPath(newData, path, newArr);
        return { data: newData };
      });
    },

    deleteAtPath: (path: Path) => {
      set((state) => {
        if (path.length === 0) {
          // Cannot delete root, reset to empty object instead
          return { data: {} };
        }

        const newData = deepCloneWithHelpersToSerialized(state.data);
        deleteByPathAndCleanup(newData, path);
        return { data: newData };
      });
    },

    resetState: (newState: any) => {
      set({
        data: deepCloneWithHelpersToSerialized(newState),
      });
    },
  }));
}

// ============================================================================
// Selector Utilities
// ============================================================================

/**
 * Creates a selector function that extracts a value at a specific path.
 * Useful for granular subscriptions that only re-render when the specific
 * path value changes.
 *
 * @param path - The path to select from the form data
 * @param fallback - Optional fallback value if path doesn't exist
 * @returns A selector function
 */
export function createPathSelector<T = unknown>(
  path: Path,
  fallback?: T
): (state: FormStore) => T {
  return (state: FormStore) => {
    const rawValue = getByPath<T>(state.data, path, fallback);
    return deepCloneWithOutHelpers(rawValue);
  };
}

/**
 * Shallow equality check for path-based subscriptions.
 * Compares primitive values directly and objects by reference.
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }

  // For objects/arrays, use reference equality
  // Zustand will create new references when values change
  return false;
}
