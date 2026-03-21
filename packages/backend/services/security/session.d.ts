import type { IUserSession, LoginRequest } from "@mapineda48/agape/security/types";

export function login(request: LoginRequest): Promise<IUserSession>;
export function isAuthenticated(): Promise<IUserSession | null>;
export function logout(): Promise<void>;

export const session: IUserSession | null;

export type { LoginRequest, IUserSession };
