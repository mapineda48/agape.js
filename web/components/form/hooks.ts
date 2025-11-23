import { createElement, useMemo, type JSX } from "react";
import { usePaths, type Path } from "./paths";
import { useAppSelector, useAppDispatch, useSelectPath } from "./store/hooks";
import { setAtPath, pushAtPath, removeAtPath } from "./store/dictSlice";
import PathProvider from "./paths";

export function useSelector<S, T>(selector: (state: S) => T) {
  return useAppSelector((state: any) => selector(state.form.data));
}

export function useInputArray<T extends unknown[]>(path?: Path) {
  const paths = usePaths(path);
  const state = useSelectPath<T>(paths, [] as unknown as T);
  const dispatch = useAppDispatch();

  return useMemo(() => {
    return {
      set(value: T) {
        dispatch(setAtPath({ path: paths, value }));
      },

      map(cb: IMap<T>) {
        return state.map((payload: any, index: number) => {
          return createElement(PathProvider, {
            key: index,
            value: [...paths, index],
            children: cb(payload, index, [...paths, index]),
          });
        });
      },

      addItem(...items: T) {
        items.forEach((item) => {
          dispatch(pushAtPath({ path: paths, value: item }));
        });
      },

      removeItem(...index: number[]) {
        dispatch(removeAtPath({ path: paths, index }));
      },

      get length() {
        return state.length;
      },
    };
  }, [state, path, paths, dispatch]);
}

export interface IInputArray<T extends unknown[]> {
  readonly map: (
    cb: (payload: T[number], index: number, paths: Path) => JSX.Element
  ) => JSX.Element[];

  readonly get: () => T;
  readonly set: (state: T) => void;
  readonly addItem: (...items: T) => void;
  readonly removeItem: (...index: number[]) => void;
  readonly length: number;
  readonly forceUpdate: () => void;
}

type IMap<T extends unknown[]> = (
  payload: T[number],
  index: number,
  paths: Path
) => JSX.Element;
