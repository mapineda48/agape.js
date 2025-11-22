import { createContext, useContext, useEffect, useMemo, type JSX } from "react";
import { useEventEmitter } from "../util/event-emitter";
import { useStore } from "react-redux";
import type { RootState } from "./store";

const Context = createContext<EventForm>({ SUBMIT: Symbol("SUBMIT") });

/**
 * Proveedor de formulario controlado.
 *
 * Este componente encapsula la lógica de gestión del estado del formulario,
 * control de inputs y eventos `merge` y `submit` mediante un EventEmitter.
 */
export default function FormProvider({ state = {}, ...core }: Props) {
  const store = useStore<RootState>();
  const emitter = useEventEmitter();

  const evt = useMemo(() => {
    return {
      SUBMIT: Symbol("SUBMIT"),
    };
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const unsubscribe = store.subscribe(() => {
        console.log("Form State:", store.getState().form.data);
      });
      return unsubscribe;
    }
  }, [store]);

  return (
    <Context.Provider value={evt}>
      <form
        {...core}
        onSubmit={(e) => {
          e.preventDefault();

          const state = store.getState();

          const payload = structuredClone(state.form.data);

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
 * Types
 */
export interface Props<T extends object = object> extends Core {
  state?: T;
}

type Core = Omit<JSX.IntrinsicElements["form"], "action" | "onSubmit">;

export interface EventForm {
  SUBMIT: symbol;
}
