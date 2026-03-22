/**
 * Service Contract: Security Session
 *
 * Runtime stubs for session management.
 * The actual implementation lives in backend/services/security/.
 */

import type { IUserSession, LoginRequest } from "../../security/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function login(request: LoginRequest): Promise<IUserSession> {
  throw new Error("Contract stub");
}

export function isAuthenticated(): Promise<IUserSession | null> {
  throw new Error("Contract stub");
}

export function logout(): Promise<void> {
  throw new Error("Contract stub");
}

export const session: IUserSession | null = null;

export type { LoginRequest, IUserSession };
