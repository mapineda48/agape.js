import { createElement, useEffect, useMemo, useRef, type JSX } from "react";
import { usePaths, type Path } from "./paths";
import { useAppSelector, useAppDispatch, useSelectPath } from "./store/hooks";
import { setAtPath, pushAtPath, removeAtPath } from "./store/dictSlice";
import PathProvider from "./paths";

import { deepCloneWithOutHelpers } from "../../utils/structuredClone";

export function useSelector<S, T>(selector: (state: S) => T) {
  const rawData = useAppSelector((state: any) => state.form.data);
  const revivedData = useMemo(
    () => deepCloneWithOutHelpers(rawData),
    [rawData]
  );
  return selector(revivedData);
}

export function useInputArray<T extends unknown[]>(path?: Path) {
  const paths = usePaths(path);
  const state = useSelectPath<T>(paths, [] as unknown as T);
  const dispatch = useAppDispatch();
  const keysRef = useRef<string[]>([]);
  const keyCounter = useRef(0);

  // Keep internal keys array aligned with current state length
  useEffect(() => {
    // Extend with new keys when items are added externally
    if (state.length > keysRef.current.length) {
      const diff = state.length - keysRef.current.length;
      const newKeys = Array.from({ length: diff }, () => {
        return `${paths.join("|")}|${keyCounter.current++}`;
      });
      keysRef.current = [...keysRef.current, ...newKeys];
    }

    // Trim keys if items are removed externally
    if (state.length < keysRef.current.length) {
      keysRef.current = keysRef.current.slice(0, state.length);
    }
  }, [state.length, paths]);

  return useMemo(() => {
    return {
      set(value: T) {
        dispatch(setAtPath({ path: paths, value }));
        // Reset keys to match the new array shape
        keysRef.current = value.map(() => `${paths.join("|")}|${keyCounter.current++}`);
      },

      map(cb: IMap<T>) {
        // Normalize path to array for concatenation
        const normalizedPath =
          path === undefined ? [] : Array.isArray(path) ? path : [path];

        return state.map((payload: any, index: number) => {
          const fullPath = [...paths, index];
          const key = keysRef.current[index] ?? `${paths.join("|")}|${index}`;
          keysRef.current[index] = key;
          // Pass the relative path (from useInputArray call) plus index to PathProvider
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
          dispatch(pushAtPath({ path: paths, value: item }));
          keysRef.current.push(`${paths.join("|")}|${keyCounter.current++}`);
        });
      },

      removeItem(...index: number[]) {
        dispatch(removeAtPath({ path: paths, index }));
        // Mirror removal on the internal keys, sorting to remove from the end first
        const sorted = [...index].sort((a, b) => b - a);
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
  }, [state, path, paths, dispatch]);
}

/**
 * Interface for the return type of useInputArray hook.
 * Provides methods to manipulate arrays in the form store.
 */
export interface IInputArray<T extends unknown[]> {
  /** Map over array items, wrapping each in a PathProvider context */
  readonly map: (
    cb: (payload: T[number], index: number, paths: Path) => JSX.Element
  ) => JSX.Element[];

  /** Replace the entire array with a new value */
  readonly set: (state: T) => void;

  /** Add one or more items to the end of the array */
  readonly addItem: (...items: T[number][]) => void;

  /** Remove items at the specified indices */
  readonly removeItem: (...index: number[]) => void;

  /** Current length of the array */
  readonly length: number;
}

type IMap<T extends unknown[]> = (
  payload: T[number],
  index: number,
  paths: Path
) => JSX.Element;
