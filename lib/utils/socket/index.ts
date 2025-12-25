export type EventMap = Record<string, void | unknown>;
type Key<E extends EventMap> = Extract<keyof E, string>;

type EmitArgs<E extends EventMap, K extends Key<E>> =
    E[K] extends void ? [] : [payload: E[K]];

type Handler<E extends EventMap, K extends Key<E>> =
    E[K] extends void ? () => void : (payload: E[K]) => void;
/**
 * Socket fuertemente tipado por mapa de eventos.
 * - emit: tipa los args por evento
 * - on/off: tipa el payload del handler por evento (retorno de la función del evento)
 */
export interface ConnectedSocket<Events extends EventMap> {
    disconnect(): void;

    on<K extends Key<Events>>(event: K, handler: Handler<Events, K>): () => void;
    off<K extends Key<Events>>(event: K, handler?: Handler<Events, K>): void;

    emit<K extends Key<Events>>(event: K, ...args: EmitArgs<Events, K>): void;

    /**
     * Connects the socket to a namespace.
     * Only available on browser client.
     * @returns The connected socket
     */
    connect(): Omit<ConnectedSocket<Events>, "connect">;
}