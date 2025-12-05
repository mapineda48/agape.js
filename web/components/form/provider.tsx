import { createContext, useContext, useMemo, type JSX } from "react";
import { useEventEmitter } from "../util/event-emitter";
import { useStore } from "react-redux";
import type { RootState } from "./store";
import { deepCloneWithOutHelpers } from "@/utils/structuredClone";

const Context = createContext<EventForm>({
  SUBMIT: Symbol("SUBMIT"),
  SUBMIT_SUCCESS: Symbol("SUBMIT_SUCCESS"),
});

/**
 * Proveedor de formulario controlado.
 *
 * Este componente encapsula la lógica de gestión del estado del formulario,
 * control de inputs y eventos `merge` y `submit` mediante un EventEmitter.
 *
 * @note El prop `state` se usa para inicializar el store y se pasa a StoreProvider,
 * no se utiliza internamente aquí.
 */
export default function FormProvider({ state: _initialState, ...core }: Props) {
  const store = useStore<RootState>();
  const emitter = useEventEmitter();

  const evt = useMemo(() => {
    return {
      SUBMIT: Symbol("SUBMIT"),
      SUBMIT_SUCCESS: Symbol("SUBMIT_SUCCESS"),
    };
  }, []);

  return (
    <Context.Provider value={evt}>
      <form
        {...core}
        onSubmit={(e) => {
          e.preventDefault();

          const state = store.getState();

          const payload = deepCloneWithOutHelpers(state.form.data);

          if (process.env.NODE_ENV === "development") {
            console.log("[Form] Submit payload", payload);
          }

          emitter.emit(evt.SUBMIT, payload);
        }}
      />
    </Context.Provider>
  );
}

export function useEvent() {
  return useContext(Context);
}

/**
 * Props for Form and FormProvider components.
 *
 * @property state - Initial state for the form store. Only used on first render.
 */
export interface Props<T extends object | any[] = object> extends Core {
  state?: T;
}

type Core = Omit<JSX.IntrinsicElements["form"], "action" | "onSubmit">;

export interface EventForm {
  SUBMIT: symbol;
  SUBMIT_SUCCESS: symbol;
}
