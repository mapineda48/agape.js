import { useCallback, useEffect } from "react";
import { usePaths, type Path } from "../paths";
import { useAppDispatch, useSelectPath } from "../store/hooks";
import { setAtPath } from "../store/dictSlice";

export default function useInput<T = unknown>(
  path: Path,
  defaultValue?: T,
  options?: { materialize?: boolean }
) {
  const paths = usePaths(path);
  const rawValue = useSelectPath<T>(paths);
  const value = rawValue !== undefined ? rawValue : defaultValue;
  const dispatch = useAppDispatch();
  const deps = paths.join("|");

  // Inicializa sólo si no hay valor aún y se entregó defaultValue
  useEffect(() => {
    if (
      rawValue === undefined &&
      typeof defaultValue !== "undefined" &&
      options?.materialize
    ) {
      dispatch(setAtPath({ path: paths, value: defaultValue }));
    }
  }, [rawValue, dispatch, defaultValue, deps, options?.materialize]);

  const setValue = useCallback(
    function setValue(value: T) {
      dispatch(setAtPath({ path: paths, value }));
    },
    [dispatch, deps]
  );

  return [value, setValue] as const;
}
