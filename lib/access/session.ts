import { createNamespace } from "cls-hooked";
import type { NextFunction } from "express";

const session = createNamespace(import.meta.filename)

export function initSession(user: IWebSession, next: NextFunction) {
    session.run(() => {
        for (const [key, value] of Object.entries(user)) {
            session.set(key, value)
        }

        next();
    });
}

const webSession: unknown = new Proxy({}, {
    get(_, key: string) {
        return session?.get(key);
    },

    set(_, key: string, value) {
        session?.set(key, value);

        return !!session;
    },
});

export default webSession as IWebSession;

/**
 * Types
 */

export interface IWebSession {
    id: number;
    fullName: string;
    avatarUrl: string | null;
}

export type IUserSession = Omit<IWebSession, "setUser">;