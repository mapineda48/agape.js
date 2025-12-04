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
 * Types
 */
export interface PropsPortal {
  style?: React.CSSProperties;
  remove: () => void;
}

export type FunctionComponent<T extends PropsPortal = PropsPortal> = (
  props: T
) => JSX.Element;

type PushToPortal = (Element: FunctionComponent) => void;

interface PortalItem {
  Item: FunctionComponent;
  key: string;
}

const Context = React.createContext<PushToPortal>(() => {
  console.warn("Portal Context not found");
});

/**
 * Higher-order component to push a component to the portal root.
 *
 * @example
 * const showModal = withPortalToRoot(MyModal);
 * showModal({ someProp: "value" });
 */
export function withPortalToRoot<P extends object>(
  Element: React.ComponentType<P & PropsPortal>
) {
  return function useShow() {
    const pushToBody = useContext(Context);

    return useCallback(
      (props: Omit<P, keyof PropsPortal>) => {
        pushToBody((portalProps) => (
          <Element {...(props as P)} {...portalProps} />
        ));
      },
      [pushToBody]
    );
  };
}

export default function PortalProvider({ children }: { children: ReactNode }) {
  // We use a ref or just a state that is stable.
  // Actually, we need the `push` function to be stable and available to consumers.
  // The `PortalFactory` needs to register itself to receive the updates,
  // OR we can lift the state up here.
  // Lifting state up is cleaner than the previous "setPush" callback pattern.

  const [items, setItems] = useState<PortalItem[]>([]);

  const push: PushToPortal = useCallback((Item) => {
    setItems((prev) => [...prev, { Item, key: crypto.randomUUID() }]);
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  return (
    <Context.Provider value={push}>
      {children}
      <PortalRoot items={items} remove={remove} />
    </Context.Provider>
  );
}

/**
 * The actual portal root that renders the items into document.body
 */
function PortalRoot({
  items,
  remove,
}: {
  items: PortalItem[];
  remove: (key: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  return ReactDOM.createPortal(
    <Fragment>
      {items.map(({ Item, key }, index) => (
        <Item
          key={key}
          style={{ zIndex: 1500 + index * 100 }}
          remove={() => remove(key)}
        />
      ))}
    </Fragment>,
    document.body
  );
}
