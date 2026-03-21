import type { IUserSession, LoginRequest } from "#shared/security/types";

export function login(request: LoginRequest): Promise<IUserSession>;
export function isAuthenticated(): Promise<IUserSession | null>;
export function logout(): Promise<void>;

export const session: IUserSession | null;

export type { LoginRequest, IUserSession };
