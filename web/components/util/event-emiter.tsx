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
const EmitterContext = createContext<Emitter>(null as unknown as Emitter);

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

  return createElement(EmitterContext.Provider, {
    value: emitter,
    children,
  });
}

/**
 * Hook personalizado para acceder y utilizar el emisor de eventos.
 *
 * Este hook devuelve un objeto proxy que facilita la suscripción y emisión
 * de eventos. Emite payloads clonados profundamente para evitar efectos secundarios.
 *
 * @returns {EmitterProxy} Objeto proxy con métodos para emitir y suscribirse a eventos.
 */
export function useEmitter(): EmitterProxy {
  const emitter = useContext(EmitterContext);

  return useMemo(() => {
    /**
     * Función para suscribirse a un evento.
     *
     * @param {string} event - Nombre del evento.
     * @param {() => void} cb - Callback que se ejecutará cuando se emita el evento.
     * @returns {() => void} Función para cancelar la suscripción.
     */
    const on = (event: string, cb: () => void): (() => void) => {
      emitter.on(event, cb);
      return () => emitter.off(event, cb);
    };

    /**
     * Función para emitir un evento con un payload clonado.
     *
     * @param {string} event - Nombre del evento.
     * @param {unknown} payload - Datos asociados al evento.
     */
    const emit$ = (event: string, payload: unknown) => {
      emitter.emit(event, _.cloneDeep(payload));
    };

    // Se utiliza un Proxy para manejar dinámicamente las llamadas a métodos de emisión o suscripción.
    return new Proxy(
      {},
      {
        get(_, event: string) {
          // Para los métodos "emit" y "on", devuelve las funciones definidas.
          switch (event) {
            case "emit":
              return emit$;
            case "on":
              return on;
          }
          // Para otros eventos, si se pasa una función, se interpreta como suscripción.
          // De lo contrario, se emite el evento con el payload proporcionado.
          return (payload: any) => {
            if (typeof payload !== "function") {
              emit$(event, payload);
              return;
            }

            return on(event, payload);
          };
        },
      }
    );
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
  initialState: T | ((state?: T) => T),
  event?: string | symbol
): [T, (state: T) => void] {
  const [state, setState] = useState<T>(initialState);
  const emitter = useEmitter();

  // Memoiza el identificador del evento para que sea estable.
  const eventKey = useMemo(() => event ?? Symbol(), [event]);

  useEffect(() => {
    // Suscribe a cambios del evento y actualiza el estado.
    const off = emitter.on(eventKey as string, setState);
    return off;
  }, [emitter, eventKey]);

  // Función para emitir el evento y actualizar el estado en otros componentes.
  const emitState = useMemo(
    () => (nextState: T) => emitter.emit(eventKey as string, nextState),
    [emitter, eventKey]
  );

  return [state, emitState];
}

/**
 * Tipos utilizados en el módulo.
 */

/**
 * Interfaz para el proxy del emisor.
 *
 * Permite llamar a eventos como métodos para emitir o suscribirse a ellos.
 */
type EmitterProxy = {
  readonly [K: string]: (...args: unknown[]) => void;
};

/**
 * Tipo que representa la instancia del emisor de eventos creada por `mitt`.
 */
type Emitter = ReturnType<typeof mitt>;
