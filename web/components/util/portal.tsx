import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import ReactDOM from "react-dom";

/**
 * ----------------------------------------------------------------------
 * TYPES
 * ----------------------------------------------------------------------
 */
export interface PortalInjectedProps {
  style?: React.CSSProperties;
  remove: () => void;
  zIndex: number;
}

export type PortalContentComponent<
  T extends PortalInjectedProps = PortalInjectedProps
> = (props: T) => JSX.Element;

type PortalDispatcher = (Element: PortalContentComponent) => void;

interface PortalItemEntry {
  Component: PortalContentComponent;
  key: string;
}

// Interfaz para comunicar el Provider con el Renderer sin causar re-renders
interface PortalStore {
  subscribe: (callback: () => void) => () => void;
  getItems: () => PortalItemEntry[];
  remove: (key: string) => void;
}

/**
 * ----------------------------------------------------------------------
 * CONTEXT & HOOKS
 * ----------------------------------------------------------------------
 */

const PortalDispatchContext = React.createContext<PortalDispatcher | null>(
  null
);

/**
 * Crea un hook personalizado para abrir un componente específico en el portal.
 */
export function createPortalHook<P extends object>(
  Component: React.ComponentType<P & PortalInjectedProps>
) {
  return function usePortalTrigger() {
    const spawn = useContext(PortalDispatchContext);

    if (!spawn) {
      throw new Error(
        "Portal Context not found. Wrap your app in <PortalProvider>"
      );
    }

    return useCallback(
      (props: Omit<P, keyof PortalInjectedProps>) => {
        spawn((injectedProps) => (
          <Component {...(props as P)} {...injectedProps} />
        ));
      },
      [spawn]
    );
  };
}

/**
 * ----------------------------------------------------------------------
 * PROVIDER (Optimized)
 * ----------------------------------------------------------------------
 */

export default function PortalProvider({ children }: { children: ReactNode }) {
  // 1. PERFORMANCE: Usamos useRef para mantener el estado.
  // Cambiar 'itemsRef' no provoca re-renderizado de este Provider ni de sus 'children'.
  const itemsRef = useRef<PortalItemEntry[]>([]);

  // Mantenemos una lista de suscriptores (el Renderer)
  const listenersRef = useRef<Set<() => void>>(new Set());

  // Notifica a los suscriptores (el Renderer) que algo cambió
  const notify = useCallback(() => {
    listenersRef.current.forEach((cb) => cb());
  }, []);

  // Función estable para eliminar items
  const remove = useCallback(
    (key: string) => {
      itemsRef.current = itemsRef.current.filter((item) => item.key !== key);
      notify();
    },
    [notify]
  );

  // Función estable para crear items (expuesta al contexto)
  const spawn: PortalDispatcher = useCallback(
    (Component) => {
      const key = crypto.randomUUID();
      itemsRef.current = [...itemsRef.current, { Component, key }];
      notify();
    },
    [notify]
  );

  // Objeto de comunicación interna (no se expone al contexto público)
  // Usamos useRef para que la referencia del objeto store sea estable entre renders
  const store = useRef<PortalStore>({
    subscribe: (cb) => {
      listenersRef.current.add(cb);
      return () => listenersRef.current.delete(cb);
    },
    getItems: () => itemsRef.current,
    remove,
  }).current;

  return (
    <PortalDispatchContext.Provider value={spawn}>
      {children}
      {/* El Renderer es el único que se enterará de los cambios */}
      <PortalRenderer store={store} />
    </PortalDispatchContext.Provider>
  );
}

/**
 * ----------------------------------------------------------------------
 * RENDERER (Isolated)
 * ----------------------------------------------------------------------
 */

function PortalRenderer({ store }: { store: PortalStore }) {
  // Estado local SOLO para este componente.
  // Cuando se actualiza, solo se repinta este fragmento, no toda la App.
  const [items, setItems] = useState<PortalItemEntry[]>(store.getItems());
  const [mounted, setMounted] = useState(false);

  // Efecto 1: Suscripción al Store
  useEffect(() => {
    setMounted(true);
    // Nos suscribimos a cambios en el ref del Provider
    const unsubscribe = store.subscribe(() => {
      // Sincronizamos el estado local con el ref
      setItems(store.getItems());
    });
    return () => {
      setMounted(false);
      unsubscribe();
    };
  }, [store]);

  // Efecto 2: SUGERENCIA - Scroll Lock
  // Bloquea el scroll del body cuando hay items abiertos
  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;

    const body = document.body;
    const hasItems = items.length > 0;

    if (hasItems) {
      // Guardamos el estilo original si es necesario,
      // o simplemente forzamos hidden
      const originalOverflow = body.style.overflow;
      body.style.overflow = "hidden";

      return () => {
        body.style.overflow = originalOverflow;
      };
    }
  }, [items.length, mounted]);

  if (!mounted || typeof document === "undefined") return null;
  if (items.length === 0) return null;

  return ReactDOM.createPortal(
    <Fragment>
      {items.map(({ Component, key }, index) => (
        <Component
          key={key}
          zIndex={1500 + index * 100} // Pasamos zIndex explícito
          style={{ zIndex: 1500 + index * 100 }} // Opcional: mantén compatibilidad
          remove={() => store.remove(key)}
        />
      ))}
    </Fragment>,
    document.body
  );
}
