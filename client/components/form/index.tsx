import {
  createContext,
  FormEvent,
  JSX,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import _ from "lodash";
import { useEmitter } from "../EventEmitter";

const Context = {
  Form: createContext(null as any as IForm<any>),
  Path: createContext(""),
};

export default function FormProvider({ state = {}, onSubmit, ...core }: Props) {
  const emitter = useEmitter();
  const ref = useRef(state);

  const form: any = useMemo(() => {
    const MERGE = Symbol("Merge");

    return {
      set(...args: unknown[]) {
        const [arg0, arg1] = args;

        const path = typeof arg0 === "string" ? arg0 : "";
        const value = args.length === 1 ? arg0 : arg1;

        if (!path) {
          ref.current = structuredClone(value) as object;
          emitter.emit(MERGE, value);
          return;
        }

        _.set(ref.current, path, _.cloneDeep(value));
        return value;
      },

      get(path: string, defaults: unknown) {
        if (!path) {
          return structuredClone(ref.current);
        }

        return structuredClone(_.get(ref.current, path, defaults));
      },

      merge(...args: unknown[]) {
        if (args.length === 1) {
          return emitter.emit(MERGE, args[0]);
        }

        const [path, cb]: [string, any] = args as any;

        return emitter.on(MERGE, (payload: any) => {
          if (!path) {
            return cb(structuredClone(payload));
          }

          if (!_.has(payload, path)) {
            return;
          }

          cb(structuredClone(_.get(payload, path)));
        });
      },
    };
  }, []);

  return (
    <Context.Form value={form}>
      <form
        {...core}
        onSubmit={(e) => {
          e.preventDefault();

          if (!onSubmit) {
            return;
          }

          const state = _.cloneDeep(ref.current);

          onSubmit(state);
        }}
      />
    </Context.Form>
  );
}

export function useForm<S = object>() {
  const form = useContext(Context.Form);

  return form as IForm<S>;
}

export function Path(props: {
  base: string;
  children: JSX.Element | JSX.Element[];
}) {
  const base = useContext(Context.Path);
  const path = useMemo(() => joinPath(base, props.base), [base, props.base]);

  return <Context.Path value={path}>{props.children}</Context.Path>;
}

const DefaultArray: any = [];

export function useInputArray<T extends unknown[]>(path = "") {
  const base = useContext(Context.Path);
  const arrayPath = useMemo(() => joinPath(base, path), [base, path]);

  const [state, forceUpdate] = useReducer((x) => x + 1, 0);
  const form = useForm();

  console.log({ state: form.get(arrayPath, DefaultArray), arrayPath, base });

  useMemo(() => {
    form.merge(arrayPath, () => {
      forceUpdate();
    });
  }, []);

  return useMemo(() => {
    const uuid = crypto.randomUUID();

    return {
      map(
        cb: (payload: T[number], index: number, path: string) => JSX.Element
      ) {
        return form
          .get(arrayPath, DefaultArray)
          .map((payload: any, index: any) => {
            const indexPath = joinPath(arrayPath, `[${index}]`);

            return (
              <Context.Path key={uuid + index} value={indexPath}>
                {cb(payload, index, indexPath)}
              </Context.Path>
            );
          });
      },

      set(state: T) {
        form.set(arrayPath, state);
      },

      addItem(...items: T) {
        const current = form.get(arrayPath, DefaultArray);

        form.set(arrayPath, [
          ...items.map((item) => structuredClone(item)),
          ...current,
        ]);

        forceUpdate();
      },
      removeItem(...index: number[]) {
        const current = form.get(arrayPath, DefaultArray);

        _.pullAt(current, index);

        form.set(arrayPath, current);

        forceUpdate();
      },

      get length() {
        return form.get(arrayPath, DefaultArray).length as number;
      },

      forceUpdate,
    } as const;
  }, [state, form, arrayPath]);
}

export function useInput<T>(path: string, defaultValue: T) {
  const base = useContext(Context.Path);
  const _path = useMemo(() => joinPath(base, path), [base, path]);

  const form: any = useForm();

  const [state, setState] = useState<T>(() => form.get(_path, defaultValue));

  const setInput = useCallback(
    (value: any) => {
      setState((current) => {
        const state = typeof value === "function" ? value(current) : value;
        form.set(_path, state);
        return state;
      });
    },
    [form, _path]
  );

  useEffect(() => form.merge(_path, setInput), [form, _path]);

  return [state, setInput, _path] as const;
}

function joinPath(base: string, path: string) {
  if (!base) {
    return path;
  }

  return base + (path.startsWith("[") ? path : "." + path);
}

/**
 * Types
 */

export interface Props<T extends object = object> extends Core {
  state?: T;
  onSubmit?: (state: T) => unknown;
}

type Core = Omit<JSX.IntrinsicElements["form"], "action" | "onSubmit">;

export interface IForm<S> {
  set(value: S): void;
  set<T>(path: string, value: T): void;
  get<T>(path: string, defaults: T): T;
  merge(source: Partial<S>): void;
  merge<T>(path: string, cb: (payload: T) => void): void;
  addItem(path: string, ...values: unknown[]): void;
  removeItem(path: string, ...index: number[]): void;
}
