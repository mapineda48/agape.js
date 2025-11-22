import { createContext, useContext, useMemo, type ReactNode } from "react";

const Context = createContext<Array<string | number>>([]);

export default function PathProvider({ children, value }: Props) {
  const path = usePaths(value);

  return <Context.Provider value={path}>{children}</Context.Provider>;
}

/**
 * Hook para combinar rutas actuales del contexto con una nueva.
 */
export function usePaths(path?: Path) {
  const context = useContext(Context);

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
 * Types
 */
export type Path = Array<string | number> | (string | number);

interface Props {
  children: ReactNode;
  value: Path;
}
