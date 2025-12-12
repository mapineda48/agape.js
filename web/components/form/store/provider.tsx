import { Provider } from "react-redux";
import { createStore } from "./index";
import { useMemo, type ReactNode } from "react";

/**
 * Props for StoreProvider component.
 */
export interface StoreProviderProps<T = unknown> {
  children: ReactNode;
  /**
   * Initial state for the form store.
   * Only used on first render - changes to this prop are ignored
   * to avoid losing form state during re-renders.
   */
  initialState?: T;
}

/**
 * StoreProvider
 *
 * Proveedor global de Redux, análogo a Context.Provider.
 * Permite encapsular el store y usarlo en cualquier parte de la app.
 *
 * @note El `initialState` solo se usa en el primer render. Cambiar este prop
 * después del montaje NO recrea el store. Esto es intencional para evitar
 * pérdida de estado del formulario durante re-renders.
 */
export default function StoreProvider<T = unknown>({
  children,
  initialState,
}: StoreProviderProps<T>) {
  // Note: initialState is intentionally NOT in dependencies.
  // The store is created once on mount and should not be recreated.
  const store = useMemo(() => createStore(initialState as any), []);
  return <Provider store={store}>{children}</Provider>;
}
