import { useCallback, useEffect } from "react";
import { usePaths, type Path } from "../paths";
import { useAppDispatch, useSelectPath } from "../store/hooks";
import { setAtPath } from "../store/dictSlice";

export default function useInput<T = unknown>(path: Path, defaultValue?: T) {
  const paths = usePaths(path);
  const value = useSelectPath<T>(paths, defaultValue);
  const dispatch = useAppDispatch();
  const deps = paths.join("|");

  // Inicializa sólo si no hay valor aún y se entregó defaultValue
  useEffect(() => {
    if (value === undefined && typeof defaultValue !== "undefined") {
      dispatch(setAtPath({ path: paths, value: defaultValue }));
    }
  }, [value, dispatch, defaultValue, deps]);

  const setValue = useCallback(
    function setValue(value: T) {
      dispatch(setAtPath({ path: paths, value }));
    },
    [dispatch, deps]
  );

  return [value, setValue] as const;
}
