import {
    createContext,
    createElement,
    JSX,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from "react";
import _, { PropertyPath } from "lodash";
import { useEmitter } from "@/components/event-emiter";
import yieldToUI from "#lib/utils/yieldToUI";

const DefaultArray: any = [];

const Context = {
    Form: createContext({} as IForm<any>),
    Path: createContext<PropertyPath[]>([]),
};

/**
 * Proveedor de formulario controlado.
 * 
 * Este componente encapsula la lógica de gestión del estado del formulario,
 * control de inputs y eventos `merge` y `submit` mediante un EventEmitter.
 */
export default function FormProvider({ state = {}, ...core }: Props) {
    const emitter = useEmitter();
    const ref = useRef(state);

    const form: any = useMemo(() => {
        const MERGE = Symbol("Merge");
        const SUBMIT = Symbol("Submit");

        return {
            set(...args: unknown[]) {
                const [arg0, arg1] = args;

                if (Array.isArray(arg0) && args.length !== 1) {
                    _.set(ref.current, arg0, structuredClone(arg1));

                    return arg1;
                }

                ref.current = structuredClone(arg0) as object;
                emitter.emit(MERGE, arg0);
            },

            get(...args: unknown[]) {
                if (!args.length) {
                    return structuredClone(ref.current);
                }

                const [arg0, arg1] = args;

                if (Array.isArray(arg0)) {
                    return structuredClone(_.get(ref.current, arg0, arg1));
                }

                throw new Error("Unkown get params");
            },

            async async(...args: unknown[]) {
                await yieldToUI();

                return this.get(...args);
            },

            merge(...args: unknown[]) {
                const [arg0, arg1] = args as any;

                if (args.length === 1) {
                    return typeof arg0 === "function"
                        ? emitter.on(MERGE, arg0)
                        : emitter.emit(MERGE, args[0]);
                }

                if (!Array.isArray(arg0)) {
                    throw new Error("Invalid paths");
                }

                if (!(typeof arg1 === "function")) {
                    throw new Error("Invalid merge handlers");
                }

                return emitter.on(MERGE, (payload: unknown) => {
                    if (!_.has(payload, arg0)) {
                        return;
                    }

                    const state = structuredClone(_.get(payload, arg0));

                    arg1(state);
                });
            },

            submit(cb: unknown) {
                if (typeof cb === "undefined") {
                    return emitter.emit(SUBMIT, ref.current);
                }

                if (typeof cb === "function") {
                    return emitter.on(SUBMIT, cb);
                }

                throw new Error("Unknown submit action");
            },
        };
    }, []);


    return createElement(Context.Form, {
        value: form,
        children: createElement("form", {
            ...core,
            onSubmit(e) {
                e.preventDefault();
                form.submit()
            }
        })
    })
}

/**
 * Hook para acceder al formulario.
 */
export function useForm<S = object>() {
    const form = useContext(Context.Form);

    return form as IForm<S>;
}

/**
 * Hook para combinar rutas actuales del contexto con una nueva.
 */
export function usePaths(path?: PropertyPath | PropertyPath[]) {
    const context = useContext(Context.Path);

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
 * Componente proveedor de contexto de ruta de formulario.
 */
export function Path(props: PropsPath) {
    const paths = usePaths(props.value);

    return createElement(Context.Path, { value: paths, children: props.children })
}

/**
 * Hook para manejar arreglos como inputs.
 */
export function useInputArray<T extends unknown[]>(
    path?: PropertyPath
): IInputArray<T> {
    const paths = usePaths(path);

    const [state, forceUpdate] = useReducer((x) => x + 1, 0);
    const form = useForm();

    useEffect(() => {
        if (!path) {
            return form.merge(() => forceUpdate());
        }

        return form.merge(paths, () => forceUpdate());
    }, [form, path, paths]);

    return useMemo(() => {
        const uuid = crypto.randomUUID();

        return {
            set(state: T) {
                if (!path) {
                    form.set(state);
                    return;
                }

                form.set(paths, state);
            },

            get() {
                if (!path) {
                    return (form.get() ?? []) as any[];
                }

                return form.get(paths, []);
            },

            map(cb: IMap<T>) {
                return this.get().map((payload: any, index: number) => {

                    return createElement(Path, {
                        key: uuid + index,
                        value: path ? [path, index] : index,
                        children: cb(payload, index, [...paths, index])
                    })
                })
            },

            addItem(...items: T) {
                const current = this.get();

                this.set([...structuredClone(items), ...current] as T);

                forceUpdate();
            },

            removeItem(...index: number[]) {
                const current = form.get(paths, DefaultArray);

                _.pullAt(current, index);

                this.set(current);

                forceUpdate();
            },

            get length() {
                return this.get().length;
            },

            forceUpdate,
        } as IInputArray<T>;
    }, [state, form, path, paths]);
}

/**
 * Hook para inputs individuales con valor y setter reactivo.
 */
export function useInput<T>(path: PropertyPath, defaultValue: T) {
    const paths = usePaths(path);
    const form: any = useForm();
    const [state, setState] = useState<T>(() => {
        const state = form.get(paths, defaultValue);
        form.set(paths, state);

        return state;
    });

    const setInput = useCallback(
        (value: any) => {
            setState((current) => {
                const state = typeof value === "function" ? value(current) : value;
                form.set(paths, state);
                return state;
            });
        },
        [form, paths]
    );

    useEffect(() => form.merge(paths, setInput), [form, paths]);

    return [state, setInput, paths] as const;
}

/**
 * Types
 */

export interface Props<T extends object = object> extends Core {
    state?: T;
}

type Core = Omit<JSX.IntrinsicElements["form"], "action" | "onSubmit">;

export interface IForm<S> {
    set(value: S): void;
    set<T>(paths: PropertyPath[], value: T): void;
    get(): S;
    get<T>(paths: PropertyPath[], defaults: T): T;
    async(): Promise<S>;
    async<T>(paths: PropertyPath[], defaults: T): Promise<T>;
    merge(source: Partial<S>): void;
    merge<T>(path: PropertyPath[], cb: (payload: T) => void): void;
    merge(cb: (payload: S) => void): void;
    submit(cb: (state: S) => unknown): void;
    submit(): void;
}

export interface IInputArray<T extends unknown[]> {
    readonly map: (
        cb: (
            payload: T[number],
            index: number,
            paths: PropertyPath[]
        ) => JSX.Element
    ) => JSX.Element[];

    readonly get: () => T;
    readonly set: (state: T) => void;
    readonly addItem: (...items: T) => void;
    readonly removeItem: (...index: number[]) => void;
    readonly length: number;
    readonly forceUpdate: () => void;
}

interface PropsPath {
    value: PropertyPath | PropertyPath[];
    children: JSX.Element | JSX.Element[];
}

type IMap<T extends unknown[]> = (payload: T[number], index: number, paths: PropertyPath[]) => JSX.Element