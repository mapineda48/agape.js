/**
 * Login request payload.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Base user session interface.
 * Used for JWT payload and unauthenticated state.
 */
export interface IUserSession {
  /** User ID (0 = unauthenticated) */
  id: number;

  /** User's permissions array */
  permissions: string[];

  /** User's full name (available after authentication) */
  fullName?: string;
}
