import React, {
  Component,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type JSX,
  type ReactNode,
} from "react";
import ReactDOM from "react-dom";
import { notifyError } from "@agape/spa";

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
      {items.map(({ Component: ItemComponent, key }, index) => {
        const zIndex = 1500 + index * 100;
        const remove = () => store.remove(key);
        return (
          <PortalErrorBoundary key={key} zIndex={zIndex} remove={remove}>
            <ItemComponent
              zIndex={zIndex}
              style={{ zIndex }}
              remove={remove}
            />
          </PortalErrorBoundary>
        );
      })}
    </Fragment>,
    document.body
  );
}

/**
 * ----------------------------------------------------------------------
 * PORTAL ERROR BOUNDARY
 * Captura errores en los componentes del portal y muestra una notificación
 * de error en la misma posición z-index. Al cerrar, libera el item.
 * ----------------------------------------------------------------------
 */

interface PortalErrorBoundaryProps {
  children: ReactNode;
  zIndex: number;
  remove: () => void;
}

interface PortalErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class PortalErrorBoundary extends Component<
  PortalErrorBoundaryProps,
  PortalErrorBoundaryState
> {
  constructor(props: PortalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): PortalErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "Error desconocido",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Construimos un stack más completo incluyendo el component stack de React
    const stack = `${error.stack}\n\nReact Component Stack:\n${errorInfo.componentStack}`;

    if (process.env.NODE_ENV !== "development") {
      notifyError(stack).catch(console.error);
    } else {
      console.error("Portal Error:", error, errorInfo);
    }
  }

  handleClose = () => {
    // Al cerrar la notificación, liberamos la posición del item
    this.props.remove();
  };

  render() {
    if (this.state.hasError) {
      const { zIndex } = this.props;

      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={this.handleClose}
        >
          <div
            style={{
              maxWidth: "28rem",
              width: "100%",
              margin: "1rem",
              padding: "2rem",
              backgroundColor: "#fff",
              borderRadius: "0.75rem",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icono de error */}
            <div
              style={{
                margin: "0 auto 1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "4rem",
                height: "4rem",
                borderRadius: "50%",
                backgroundColor: "#FEE2E2",
              }}
            >
              <svg
                style={{ width: "2rem", height: "2rem", color: "#DC2626" }}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            {/* Título */}
            <h3
              style={{
                marginBottom: "0.5rem",
                fontSize: "1.25rem",
                fontWeight: 600,
                color: "#111827",
              }}
            >
              Error en el componente
            </h3>

            {/* Mensaje */}
            <p
              style={{
                marginBottom: "1.5rem",
                fontSize: "0.875rem",
                color: "#6B7280",
                lineHeight: 1.5,
              }}
            >
              {this.state.errorMessage ||
                "Ha ocurrido un error inesperado. Por favor, cierre esta notificación e intente de nuevo."}
            </p>

            {/* Botón cerrar */}
            <button
              onClick={this.handleClose}
              style={{
                width: "100%",
                padding: "0.625rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "#4F46E5",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#4338CA")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#4F46E5")
              }
            >
              Cerrar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * ----------------------------------------------------------------------
 * SIMPLE PORTAL COMPONENT
 * ----------------------------------------------------------------------
 */
export function Portal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(children, document.body);
}
