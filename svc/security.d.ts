import type { IUserSession } from "../lib/context";

export function login(username: string, password: string): Promise<void>;
export function isAuthenticated(): Promise<IUserSession>;
export function logout(): Promise<boolean>;

export const session: IUserSession;
