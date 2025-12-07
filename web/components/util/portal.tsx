import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useState,
  type JSX,
  type ReactNode,
} from "react";
import ReactDOM from "react-dom";

/**
 * Props "inyectadas" automáticamente.
 */
export interface PortalInjectedProps {
  style?: React.CSSProperties;
  remove: () => void;
}

/**
 * Describir mejor que es el contenido de un portal.
 */
export type PortalContentComponent<
  T extends PortalInjectedProps = PortalInjectedProps
> = (props: T) => JSX.Element;

type PortalDispatcher = (Element: PortalContentComponent) => void;

interface PortalItemEntry {
  Component: PortalContentComponent;
  key: string;
}

const PortalDispatchContext = React.createContext<PortalDispatcher>(() => {
  console.warn(
    "PortalDispatchContext not found. Ensure PortalProvider is higher up in the tree."
  );
});

/**
 * Factory function to create a hook for a specific component.
 *
 * @example
 * const useModal = createPortalHook(MyModal);
 * // Dentro del componente:
 * const openModal = useModal();
 * openModal({ someProp: "value" });
 */
export function createPortalHook<P extends object>(
  Component: React.ComponentType<P & PortalInjectedProps>
) {
  return function usePortalTrigger() {
    const spawn = useContext(PortalDispatchContext);

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

export default function PortalProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PortalItemEntry[]>([]);

  // 'spawn' es más descriptivo que 'push' para UI (generar/engendrar una instancia)
  const spawn: PortalDispatcher = useCallback((Component) => {
    setItems((prev) => [...prev, { Component, key: crypto.randomUUID() }]);
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  return (
    <PortalDispatchContext.Provider value={spawn}>
      {children}
      <PortalRenderer items={items} remove={remove} />
    </PortalDispatchContext.Provider>
  );
}

/**
 * Renombrado a 'Renderer' ya que es el encargado
 * de pintar la lista en el DOM real.
 */
function PortalRenderer({
  items,
  remove,
}: {
  items: PortalItemEntry[];
  remove: (key: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  if (items.length === 0) return null;

  return ReactDOM.createPortal(
    <Fragment>
      {items.map(({ Component, key }, index) => (
        <Component
          key={key}
          style={{ zIndex: 1500 + index * 100 }}
          remove={() => remove(key)}
        />
      ))}
    </Fragment>,
    document.body
  );
}
