import { createNamespace, getNamespace } from "cls-hooked";
import { NextFunction } from "express";

export function initSession(user: IWebSession, next: NextFunction) {
  const session = createNamespace(__filename)
  session.run(() => {
    forEachEntrie(user, (key, value) =>
      session.set(key, value)
    );

    next();
  });
}

const webSession: unknown = new Proxy({}, {
  get(session, key: string) {
    return getNamespace(__filename)?.get(key);
  },

  set(session, key: string, value) {
    getNamespace(__filename)?.set(key, value);
    return true;
  },
});

function forEachEntrie(
  target: object,
  cb: (key: string, value: unknown) => void
) {
  Object.entries(target).forEach(([key, value]) => cb(key, value));
}

export default webSession as IWebSession;

/**
 * Types
 */

export interface IWebSession {
  id: number;
  fullName: string;
}

export type IUserSession = Omit<IWebSession, "setUser">;
