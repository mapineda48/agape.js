import type { IUserSession } from "./security/user";

export function login(username: string, password: string): Promise<void>;
export function isAuthenticated(): Promise<IUserSession>;
export function logout(): Promise<boolean>;

export const session: IUserSession;
