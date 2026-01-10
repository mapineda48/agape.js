import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Types
 */
export interface IContext {
    readonly tenant: string;
    id: number;
    permissions: string[];
    session: Map<unknown, unknown>;
}

/**
 * Internal ALS store
 */
const als = new AsyncLocalStorage<IContext>();

/**
 * Inicializa el "singleton por request".
 * Úsalo en tu middleware de Express (o en cualquier boundary por request).
 */
export function runContext(ctx: IContext, next: (...args: unknown[]) => unknown) {
    // Crea un store por request y ejecuta el callback dentro del contexto async
    als.run({ ...ctx, session: new Map() }, () => {
        next();
    });
}

function getStore() {
    const store = als.getStore();

    if (!store) {
        throw new Error("No hay contexto activo (¿faltó runContext en el request?)")
    };

    return store;
}

/**
 * API compatible con tu estilo anterior: webSession.id, webSession.fullName, etc.
 */
const ctx: unknown = new Proxy({} as IContext,
    {
        get(_target, key, receiver) {
            const store = getStore();

            return Reflect.get(store, key, receiver);
        },
        set(_target, key: string, value: unknown) {
            const store = getStore();

            return Reflect.set(store, key, value, store);
        },
    },
);

export default ctx as IContext;
