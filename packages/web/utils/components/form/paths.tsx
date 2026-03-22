/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useFormActions } from "./store/zustand-provider";

const Context = createContext<Array<string | number>>([]);

/**
 * PathProvider wraps children in a path context, allowing nested inputs
 * to automatically inherit and extend the path prefix.
 *
 * @param value - The path segment(s) to add to the context
 * @param autoCleanup - If true, removes all values under this path when unmounted
 * @param children - Child components that will inherit this path context
 *
 * @example
 * ```tsx
 * // Simple usage - inputs under this will have paths like ["user", "name"]
 * <PathProvider value="user">
 *   <Input.Text path="name" />
 * </PathProvider>
 *
 * // With autoCleanup - entire "advanced" subtree is removed on unmount
 * {showAdvanced && (
 *   <PathProvider value="advanced" autoCleanup>
 *     <Input.Text path="notes" />
 *     <Input.Int path="priority" />
 *   </PathProvider>
 * )}
 * ```
 */
export default function PathProvider({ children, value, autoCleanup }: Props) {
  const path = usePaths(value);
  const actions = useFormActions();

  // Keep a ref to the latest path for cleanup to avoid stale closures
  const pathsRef = useRef(path);
  useEffect(() => {
    pathsRef.current = path;
  }, [path]);

  // AutoCleanup: Remove entire subtree from store when PathProvider unmounts
  useEffect(() => {
    if (!autoCleanup) return;

    return () => {
      actions.deleteAtPath(pathsRef.current);
    };
  }, [actions, autoCleanup]);

  return <Context.Provider value={path}>{children}</Context.Provider>;
}

/**
 * Hook para combinar rutas actuales del contexto con una nueva.
 */
export function usePaths(path?: Path) {
  const context = useContext(Context);

  return useMemo(() => {
    if (path === undefined) {
      return [...context];
    }

    if (Array.isArray(path)) {
      return [...context, ...path];
    }

    return [...context, path];
  }, [path, context]);
}

/**
 * Types
 */
export type Path = Array<string | number> | (string | number);

interface Props {
  children: ReactNode;
  value: Path;
  /**
   * If true, removes all values under this path when the PathProvider unmounts.
   * This is useful for conditional sections where the entire subtree should be
   * cleaned up when hidden.
   */
  autoCleanup?: boolean;
}
