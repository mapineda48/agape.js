import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from "react-redux";
import type { RootState, AppDispatch } from "./index";
import { getByPath, type Path } from "./dictSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

import { useMemo } from "react";
import { removeHelpersFromSerialized } from "../../../utils/structuredClone";

export function useSelectPath<T = unknown>(path: Path, fallback?: T) {
  const rawValue = useAppSelector((store) =>
    getByPath<T>(store.form.data, path, fallback)
  );

  return useMemo(() => removeHelpersFromSerialized(rawValue), [rawValue]);
}
