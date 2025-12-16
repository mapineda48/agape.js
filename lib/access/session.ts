import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Types
 */
export interface IWebSession {
    id: number;
    fullName: string;
    avatarUrl: string | null;
}

export type IUserSession = Omit<IWebSession, "setUser">;

/**
 * Internal ALS store
 */
const als = new AsyncLocalStorage<IWebSession>();

/**
 * Inicializa el "singleton por request".
 * Úsalo en tu middleware de Express (o en cualquier boundary por request).
 */
export function initSession(user: IWebSession, next: (...args: unknown[]) => unknown) {
    // Crea un store por request y ejecuta el callback dentro del contexto async
    als.run({ ...user }, () => {
        next();
    });
}

/**
 * Helpers opcionales (más explícitos que el Proxy)
 */
export function getSession(): IWebSession {
    const store = als.getStore();
    if (!store) throw new Error("No hay sesión activa (¿faltó initSession en el request?)");
    return store;
}

export function setSessionValue<K extends keyof IWebSession>(key: K, value: IWebSession[K]) {
    const store = als.getStore();
    if (!store) throw new Error("No hay sesión activa (¿faltó initSession en el request?)");
    store[key] = value;
}

/**
 * API compatible con tu estilo anterior: webSession.id, webSession.fullName, etc.
 */
const webSession: unknown = new Proxy(
    {},
    {
        get(_target, key: string) {
            const store = als.getStore();
            return store ? (store as any)[key] : undefined;
        },
        set(_target, key: string, value: any) {
            const store = als.getStore();
            if (!store) throw new Error("No hay sesión activa (¿faltó initSession en el request?)");
            (store as any)[key] = value;
            return true;
        },
    },
);

export default webSession as IWebSession;
