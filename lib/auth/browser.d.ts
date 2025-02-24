import type { IUserSession } from "./session";

export function login(auth: {
  username: string;
  password: string;
}): Promise<void>;
export function isAuthenticated(): Promise<void>;
export function logout(): Promise<boolean>;

export const sync: Promise<void>;

export const user: IUserSession;
