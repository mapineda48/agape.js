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

  console.log(structuredClone(ref.current));

  const form: any = useMemo(() => {
    const MERGE = Symbol("Merge");

    return {
      set(path: string, value: unknown) {
        _.set(ref.current, path, _.cloneDeep(value));
        return value;
      },

      get(path: string, defaults: unknown) {
        return structuredClone(_.get(ref.current, path, defaults));
      },

      merge(...args: unknown[]) {
        if (args.length === 1) {
          return emitter.emit(MERGE, args[0]);
        }

        const [path, cb]: [string, any] = args as any;

        return emitter.on(MERGE, (payload: any) => {
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

          if (onSubmit) {
            onSubmit(_.cloneDeep(ref.current));
          }
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
  const path = useMemo(() => joinPath(base, props.base), []);

  return <Context.Path value={path}>{props.children}</Context.Path>;
}

const DefaultArray: any = [];

export function useArray<T extends unknown[]>(path: string) {
  const base = useContext(Context.Path);
  const arrayPath = useMemo(() => joinPath(base, path), [base, path]);

  const [state, forceUpdate] = useReducer((x) => x + 1, 0);
  const form = useForm();

  return useMemo(() => {
    const uuid = crypto.randomUUID();

    return {
      map(cb: any) {
        return form.get(arrayPath, DefaultArray).map((payload: any, index: any) => (
          <Context.Path
            key={uuid + index}
            value={joinPath(arrayPath, `[${index}]`)}
          >
            {cb(payload, index)}
          </Context.Path>
        ));
      },
      addItem(...items: T) {
        const current = form.get(arrayPath, DefaultArray);

        form.set(path, [
          ...items.map((item) => structuredClone(item)),
          ...current,
        ]);

        forceUpdate();
      },
      removeItem(...index: number[]) {
        const current = form.get(arrayPath, DefaultArray);

        _.pullAt(current, index);

        form.set(path, current);

        forceUpdate();
      },
    } as const;
  }, [state, form]);
}

export function useInput<T>(path: string, defaultValue: T) {
  const base = useContext(Context.Path);
  const _path = useMemo(() => joinPath(base, path), [base, path]);

  const form: any = useForm();

  const [state, setState] = useState<T>(() => form.get(_path, defaultValue));

  console.log(state);

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

export interface Props<T extends {} = {}> extends Core {
  state?: T;
  onSubmit?: (...args: unknown[]) => unknown;
}

type Core = Omit<JSX.IntrinsicElements["form"], "action">;

export interface IForm<S> {
  set<T>(path: string, value: T): void;
  get<T>(path: string, defaults: T): T;
  merge(source: Partial<S>): void;
  addItem(path: string, ...values: unknown[]): void;
  removeItem(path: string, ...index: number[]): void;
}