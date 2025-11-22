import _ from "lodash";
import mitt from "mitt";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  createElement,
  useState,
  type ReactNode,
  type JSX,
} from "react";

/**
 * Contexto de React que provee la instancia del emisor de eventos.
 */
const Context = createContext<Emitter>(null as unknown as Emitter);

/**
 * Componente EventEmitter.
 *
 * Este componente inicializa el emisor de eventos utilizando `mitt` y lo
 * provee a los componentes hijos mediante React Context. Además, se encarga
 * de limpiar los listeners registrados al desmontar el componente.
 *
 * @param {Object} props - Propiedades del componente.
 * @param {ReactNode} props.children - Componentes hijos que requieren el emisor.
 * @returns {JSX.Element} Proveedor del contexto del emisor.
 */
export default function EventEmitter({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  // Crea una instancia memoizada del emisor de eventos.
  const emitter = useMemo(mitt, []);

  // Al desmontar, limpia todos los listeners registrados.
  useEffect(() => {
    return () => {
      emitter.all.clear();
    };
  }, [emitter]);

  return createElement(Context.Provider, {
    value: emitter,
    children,
  });
}

export function useDispatch() {
  const emitter = useContext(Context);

  return useMemo(() => {
    // Se utiliza un Proxy para manejar dinámicamente las llamadas a métodos de emisión o suscripción.
    return new Proxy({} as IProxy, {
      get(_, event: string) {
        return (payload: any) => {
          if (typeof payload !== "function") {
            return emitter.emit(event, payload);
          }

          emitter.on(event, payload);

          return () => emitter.off(event, payload);
        };
      },
    });
  }, [emitter]);
}

/**
 * Hook personalizado para acceder y utilizar el emisor de eventos.
 *
 * Este hook devuelve un objeto proxy que facilita la suscripción y emisión
 * de eventos. Emite payloads clonados profundamente para evitar efectos secundarios.
 *
 * @returns {IEmitter} Objeto proxy con métodos para emitir y suscribirse a eventos.
 */
export function useMitt(): IEmitter {
  const emitter = useContext(Context);

  return useMemo(() => {
    /**
     * Función para suscribirse a un evento.
     *
     * @param {string} event - Nombre del evento.
     * @param {() => void} cb - Callback que se ejecutará cuando se emita el evento.
     * @returns {() => void} Función para cancelar la suscripción.
     */
    const on: any = (event: string, cb: () => void): (() => void) => {
      emitter.on(event, cb);
      return () => emitter.off(event, cb);
    };

    /**
     * Función para emitir un evento con un payload clonado.
     *
     * @param {string} event - Nombre del evento.
     * @param {unknown} payload - Datos asociados al evento.
     */
    const emit: any = (event: string, payload: unknown) => {
      emitter.emit(event, payload);
    };

    return { on, emit };
  }, [emitter]);
}

/**
 * Hook personalizado para manejar estado sincronizado mediante eventos.
 *
 * Permite compartir y actualizar estado entre componentes usando el emisor de eventos.
 *
 * @param initialState Estado inicial.
 * @param event Nombre del evento opcional. Si no se provee, se genera uno único.
 * @returns [state, setState] Estado actual y función para actualizarlo (emitir evento).
 */
export function useEvent<T = unknown>(
  initialState: T | ((state?: T) => T)
): [T, (state: T) => void] {
  const [state, setState] = useState<T>(initialState);
  const emitter = useContext(Context);

  // Memoiza el identificador del evento para que sea estable.
  const { event, setValue } = useMemo(() => {
    const event = Symbol();

    const setValue = (value: T) => {
      const payload =
        typeof value === "function" ? value : structuredClone(value);

      emitter.emit(event, payload);
    };

    return { event, setValue };
  }, []);

  useEffect(() => {
    const handler: any = setState;

    emitter.on(event, handler);
    return () => {
      emitter.off(event, handler);
    };
  }, [emitter, event]);

  return [state, setValue];
}

/**
 * Tipos utilizados en el módulo.
 */

/**
 * Interfaz para el proxy del emisor.
 *
 * Permite llamar a eventos como métodos para emitir o suscribirse a ellos.
 */
type IEmitter = {
  on: (
    event: string | Symbol,
    cb: (() => void) | (<T>(payload: T) => void)
  ) => () => void;
  emit: <T>(event: string | Symbol, payload: T) => void;
};

type IProxy = {
  readonly [K: string]: (...args: unknown[]) => void;
};

/**
 * Tipo que representa la instancia del emisor de eventos creada por `mitt`.
 */
type Emitter = ReturnType<typeof mitt>;
