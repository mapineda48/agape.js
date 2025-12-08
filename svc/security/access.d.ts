import type { IUserSession, LoginRequest } from "#/lib/access/session";

export function login(request: LoginRequest): Promise<void>;
export function isAuthenticated(): Promise<IUserSession>;
export function logout(): Promise<boolean>;

export const session: IUserSession;

export type { LoginRequest };
