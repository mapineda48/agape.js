import { createElement, useMemo, useReducer, type JSX } from "react";
import { usePaths, type Path } from "./paths";
import { useAppSelector } from "./store/hooks";
import useInput from "./Input/useInput";
import { pullAt } from "@/utils/objectPath";
import PathProvider from "./paths";

export function useSelector<S, T>(selector: (state: S) => T) {
  return useAppSelector((state: any) => selector(state.form.data));
}

export function useInputArray<T extends unknown[]>(path: Path) {
  const paths = usePaths(path);
  const [state, setState] = useInput(paths, [] as unknown[]);

  return useMemo(() => {
    const uuid = crypto.randomUUID();

    return {
      set(state: T) {
        setState(state);
      },

      map(cb: IMap<T>) {
        return state.map((payload: any, index: number) => {
          return createElement(PathProvider, {
            key: uuid + index,
            value: [...paths, index],
            children: cb(payload, index, [...paths, index]),
          });
        });
      },

      addItem(...items: T) {
        state.push(...items);
      },

      removeItem(...index: number[]) {
        pullAt(state, index);
      },

      get length() {
        return state.length;
      },

    };
  }, [state, path, paths]);
}

export interface IInputArray<T extends unknown[]> {
    readonly map: (
        cb: (
            payload: T[number],
            index: number,
            paths: Path
        ) => JSX.Element
    ) => JSX.Element[];

    readonly get: () => T;
    readonly set: (state: T) => void;
    readonly addItem: (...items: T) => void;
    readonly removeItem: (...index: number[]) => void;
    readonly length: number;
    readonly forceUpdate: () => void;
}

type IMap<T extends unknown[]> = (payload: T[number], index: number, paths: Path) => JSX.Element