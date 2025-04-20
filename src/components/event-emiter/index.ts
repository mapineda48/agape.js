import mitt from "mitt";
import { createContext, useContext, useEffect, useMemo, ReactNode, createElement, JSX, useState } from "react";

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
export default function EventEmitter({ children }: { children: ReactNode }): JSX.Element {
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
        children
    })
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
        const on = (event: string, cb: () => void): () => void => {
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
            emitter.emit(event, structuredClone(payload));
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

export const useEvent: typeof useState = ((initialState: unknown, event?: string) => {
    const [state, setState] = useState(initialState);
    const emitter = useEmitter();

    const [unlisten, dispatchEvent] = useMemo(() => {
        const dispatchEvent = event ?? Symbol();

        return [emitter.on(dispatchEvent, setState), (state: unknown) => emitter.emit(dispatchEvent, state)]

    }, [emitter, event]);

    useEffect(() => unlisten, [unlisten]);

    const res: any = [state, dispatchEvent];

    return res
}) as any;

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