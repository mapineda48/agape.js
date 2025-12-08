import { useCallback, useEffect, useRef } from "react";
import { usePaths, type Path } from "../paths";
import { useAppDispatch, useSelectPath } from "../store/hooks";
import { setAtPath, deleteAtPath } from "../store/dictSlice";

/**
 * Options for the useInput hook.
 */
export interface UseInputOptions {
  /**
   * If true, immediately writes the default value to the store on mount
   * when there is no existing value at that path.
   */
  materialize?: boolean;
  /**
   * If true, removes the value from the store when the component unmounts.
   * This also cleans up any empty parent objects/arrays created by this path.
   */
  autoCleanup?: boolean;
}

/**
 * Hook to bind a form input to a path in the Redux form store.
 *
 * @param path - The path within the form store where this input's value is stored
 * @param defaultValue - Default value to use when there's no value at the path
 * @param options - Configuration options for materialization and cleanup behavior
 * @returns A tuple of [currentValue, setValue] for controlled input binding
 */
export default function useInput<T = unknown>(
  path: Path,
  defaultValue?: T,
  options?: UseInputOptions
) {
  const paths = usePaths(path);
  const rawValue = useSelectPath<T>(paths);
  const value = rawValue !== undefined ? rawValue : defaultValue;
  const dispatch = useAppDispatch();
  const deps = paths.join("|");

  // Keep a ref to the latest path for cleanup to avoid stale closures
  const pathsRef = useRef(paths);
  pathsRef.current = paths;

  // Materialize: Initialize only if no value yet and defaultValue was provided
  useEffect(() => {
    if (
      rawValue === undefined &&
      typeof defaultValue !== "undefined" &&
      options?.materialize
    ) {
      dispatch(setAtPath({ path: paths, value: defaultValue }));
    }
  }, [rawValue, dispatch, defaultValue, deps, options?.materialize]);

  // AutoCleanup: Remove value from store when component unmounts
  useEffect(() => {
    if (!options?.autoCleanup) return;

    return () => {
      dispatch(deleteAtPath({ path: pathsRef.current }));
    };
  }, [dispatch, options?.autoCleanup]);

  const setValue = useCallback(
    function setValue(value: T) {
      dispatch(setAtPath({ path: paths, value }));
    },
    [dispatch, deps]
  );

  return [value as T, setValue] as const;
}
