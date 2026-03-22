import rpc from "@mapineda48/agape-rpc/client/rpc";
import { type IUserSession, type LoginRequest } from "@mapineda48/agape-core/security/types";
import { routes } from "@mapineda48/agape-core/security/route";

export type { IUserSession, LoginRequest };

/**
 * Current user session state.
 * null = not authenticated or not yet checked.
 */
export let session: IUserSession | null = null;

/**
 * Authenticates user with credentials and stores session.
 */
export async function login(args: LoginRequest): Promise<IUserSession> {
  const loginRpc = rpc<[LoginRequest], IUserSession>(routes.login);
  const state = await loginRpc(args);
  session = state;
  return state;
}

/**
 * Logs out current user and clears session.
 */
export async function logout(): Promise<void> {
  const logoutRpc = rpc<[], void>(routes.logout);
  await logoutRpc();
  session = null;
}

/**
 * Checks if user is authenticated.
 * Returns cached session if available, otherwise fetches from server.
 * Returns null if not authenticated.
 */
export async function isAuthenticated(): Promise<IUserSession | null> {
  if (session) {
    return session;
  }

  const checkAuthRpc = rpc<[], IUserSession>(routes.isAuthenticated);

  try {
    session = await checkAuthRpc();
    return session;
  } catch {
    return null;
  }
}
