import { createElement, useEffect, useMemo, useRef, type JSX } from "react";
import { usePaths, type Path } from "./paths";
import { useSelectPath } from "./store/hooks";
import { useFormStoreApi, useFormActions, useFormData } from "./store/zustand-provider";
import PathProvider from "./paths";

import { deepCloneWithOutHelpers } from "#web/utils/clone";

/**
 * Hook for selecting derived data from the form state.
 * Revives special types (Decimal, DateTime) from their serialized form.
 *
 * @param selector Function to select data from the form state
 * @returns The selected data
 */
export function useSelector<S, T>(selector: (state: S) => T) {
  const rawData = useFormData<S>();
  return selector(rawData);
}

// Unique ID for each useFieldArray instance to ensure key uniqueness
let instanceId = 0;

/**
 * Hook for managing dynamic arrays in the form store.
 * Provides methods to add, remove, and map over array items.
 *
 * @param path Path to the array in the form store
 * @returns Object with array manipulation methods
 *
 * ⚠️ **Key Stability Warning:**
 * Keys are tracked by index-based position. When using `removeItem()`, keys are
 * correctly removed at the specified indices. However, if items are removed or
 * reordered **externally** (e.g., via `Form.useForm().setAt()` or store actions),
 * the key mapping may become incorrect.
 *
 * For optimal key stability with complex lists, consider using objects with
 * unique `id` fields and rendering your own keys based on those IDs:
 *
 * ```tsx
 * items.map((item, index) => (
 *   <div key={item.id}> {/* Use item.id instead of index *}
 *     ...
 *   </div>
 * ))
 * ```
 *
 * @example
 * ```tsx
 * function TagList() {
 *   const tags = Form.useArray<string[]>("tags");
 *
 *   return (
 *     <div>
 *       {tags.map((tag, index) => (
 *         <div key={index}>
 *           <Form.Text path="." />
 *           <button onClick={() => tags.removeItem(index)}>Remove</button>
 *         </div>
 *       ))}
 *       <button onClick={() => tags.addItem("")}>Add Tag</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFieldArray<T extends unknown[]>(
  path?: Path
): IFieldArray<T> {
  const paths = usePaths(path);
  const state = useSelectPath<T>(paths, [] as unknown as T);
  const actions = useFormActions();
  const keysRef = useRef<string[]>([]);
  const keyCounter = useRef(0);
  // Each instance gets a unique ID to prevent key collisions across instances
  const instanceIdRef = useRef(instanceId++);

  // Generate a unique key prefix - use instance ID when paths is empty
  const keyPrefix =
    paths.length > 0 ? paths.join("|") : `_root_${instanceIdRef.current}`;

  // Keep internal keys array aligned with current state length
  useEffect(() => {
    // Extend with new keys when items are added externally
    if (state.length > keysRef.current.length) {
      const diff = state.length - keysRef.current.length;
      const newKeys = Array.from({ length: diff }, () => {
        return `${keyPrefix}|${keyCounter.current++}`;
      });
      keysRef.current = [...keysRef.current, ...newKeys];
    }

    // Trim keys if items are removed externally
    if (state.length < keysRef.current.length) {
      keysRef.current = keysRef.current.slice(0, state.length);
    }
  }, [state.length, keyPrefix]);

  return useMemo(() => {
    // Ensure keys are initialized on first render (before useEffect runs)
    if (keysRef.current.length < state.length) {
      const diff = state.length - keysRef.current.length;
      const newKeys = Array.from({ length: diff }, () => {
        return `${keyPrefix}|${keyCounter.current++}`;
      });
      keysRef.current = [...keysRef.current, ...newKeys];
    }

    return {
      set(value: T) {
        actions.setAtPath(paths, value);
        // Reset keys to match the new array shape
        keysRef.current = value.map(
          () => `${keyPrefix}|${keyCounter.current++}`
        );
      },

      map(cb: FieldArrayMapCallback<T>) {
        // Normalize path to array for concatenation
        const normalizedPath =
          path === undefined ? [] : Array.isArray(path) ? path : [path];

        return state.map((payload: any, index: number) => {
          const fullPath = [...paths, index];
          // Always use keysRef - it's guaranteed to be populated by the useMemo initialization above
          const key = keysRef.current[index];
          // Pass the relative path (from useFieldArray call) plus index to PathProvider
          // PathProvider will concatenate with its parent context
          const relativePath = [...normalizedPath, index];
          return createElement(PathProvider, {
            // Use full path as key for stability when items are added/removed
            key,
            value: relativePath,
            children: cb(payload, index, fullPath),
          });
        });
      },

      addItem(...items: T[number][]) {
        items.forEach((item) => {
          actions.pushAtPath(paths, item);
          keysRef.current.push(`${keyPrefix}|${keyCounter.current++}`);
        });
      },

      removeItem(...indices: number[]) {
        actions.removeAtPath(paths, indices);
        // Mirror removal on the internal keys, sorting to remove from the end first
        const sorted = [...indices].sort((a, b) => b - a);
        sorted.forEach((idx) => {
          if (idx >= 0 && idx < keysRef.current.length) {
            keysRef.current.splice(idx, 1);
          }
        });
      },

      get length() {
        return state.length;
      },
    };
  }, [state, path, paths, actions, keyPrefix]);
}

/**
 * Interface for the return type of useFieldArray hook.
 * Provides methods to manipulate arrays in the form store.
 */
export interface IFieldArray<T extends unknown[]> {
  /** Map over array items, wrapping each in a PathProvider context */
  readonly map: (
    cb: (payload: T[number], index: number, paths: Path) => JSX.Element
  ) => JSX.Element[];

  /** Replace the entire array with a new value */
  readonly set: (state: T) => void;

  /** Add one or more items to the end of the array */
  readonly addItem: (...items: T[number][]) => void;

  /** Remove items at the specified indices */
  readonly removeItem: (...indices: number[]) => void;

  /** Current length of the array */
  readonly length: number;
}

type FieldArrayMapCallback<T extends unknown[]> = (
  payload: T[number],
  index: number,
  paths: Path
) => JSX.Element;

// Backward compatibility alias
/** @deprecated Use useFieldArray instead */
export const useInputArray = useFieldArray;

/** @deprecated Use IFieldArray instead */
export type IInputArray<T extends unknown[]> = IFieldArray<T>;
