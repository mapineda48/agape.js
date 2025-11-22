import { Provider } from "react-redux";
import { store } from "./index";
import { type ReactNode } from "react";

/**
 * StoreProvider
 * 
 * Proveedor global de Redux, análogo a Context.Provider.
 * Permite encapsular el store y usarlo en cualquier parte de la app.
 */
export default function StoreProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
