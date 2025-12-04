import { Provider } from "react-redux";
import { createStore } from "./index";
import { useMemo, type ReactNode } from "react";

/**
 * StoreProvider
 * 
 * Proveedor global de Redux, análogo a Context.Provider.
 * Permite encapsular el store y usarlo en cualquier parte de la app.
 */
export default function StoreProvider({ children, initialState }: { children: ReactNode, initialState?: any }) {
  const store = useMemo(() => createStore(initialState), []);
  return <Provider store={store}>{children}</Provider>;
}
