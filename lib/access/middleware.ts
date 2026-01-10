/**
 * Authentication Middleware Module
 *
 * Express middleware that handles user authentication via JWT tokens.
 * Supports login, logout, session validation, and route protection.
 *
 * This module exports:
 * - `createAuthMiddleware`: Factory function for creating the middleware (testable)
 * - Default export: Pre-configured middleware instance for production use
 */

import express, { type Response } from "express";

import Jwt from "./Jwt";
import ctx, { runContext, type IContext, type IUserSession } from "../context";
import { decode, encode } from "#utils/msgpack";

// ============================================================================
// Constants
// ============================================================================

const AUTH_TOKEN_COOKIE = "auth_token";
const AUTH_FAILED_MESSAGE = "Falló Autenticación";

// ============================================================================
// Types
// ============================================================================

/**
 * Login request payload.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Function to find a user by credentials.
 * @param username - User's username
 * @param password - User's password (plain text)
 * @returns User session data if credentials are valid, null otherwise
 */
export type FindByCredentials = (
  username: string,
  password: string
) => Promise<IUserSession | null>;

/**
 * Function to find a user by ID.
 * @param id - User's ID
 * @returns User session data if found, null otherwise
 */
export type FindById = (id: number) => Promise<IUserSession | null>;

/**
 * Options for creating the authentication middleware.
 */
export interface CreateAuthOptions {
  /**
   * JWT secret key for signing and verifying tokens.
   */
  secret: string;

  /**
   * Function to find user by credentials (for login).
   */
  findByCredentials: FindByCredentials;

  /**
   * Function to find user by ID (for session validation).
   */
  findById: FindById;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts auth token from cookie header.
 */
export function getCookie(header?: string): string | undefined {
  if (!header) {
    return;
  }

  const [, token] = header.match(/auth_token=([^;]+)/) ?? [];

  return token;
}

/**
 * Sends a MessagePack encoded response.
 */
function sendMsgPack(res: Response, payload: unknown, status = 200): void {
  const body = encode(payload);

  res.set("Content-Type", "application/msgpack");
  res.status(status).send(body);
}

// ============================================================================
// Auth Middleware Factory
// ============================================================================

/**
 * Creates an authentication middleware with the provided configuration.
 *
 * This factory function enables:
 * - **Dependency Injection**: Pass custom user lookup functions
 * - **Unit Testing**: Mock user services for isolated testing
 * - **Flexibility**: Different auth providers for different environments
 *
 * @param options - Configuration options for the middleware
 * @returns Express router with authentication routes
 *
 * @example
 * ```typescript
 * // Basic usage with custom user services
 * const authMiddleware = createAuthMiddleware({
 *   secret: 'my-jwt-secret',
 *   findByCredentials: async (username, password) => {
 *     // Custom authentication logic
 *     return await myUserService.authenticate(username, password);
 *   },
 *   findById: async (id) => {
 *     // Custom user lookup
 *     return await myUserService.getById(id);
 *   }
 * });
 *
 * app.use(authMiddleware);
 * ```
 */
export function createAuthMiddleware(options: CreateAuthOptions) {
  const { secret, findByCredentials, findById } = options;

  const router = express.Router();
  const jwt = new Jwt(secret);
  const failLogin = new Error(AUTH_FAILED_MESSAGE);

  const cookieOptions: express.CookieOptions = {
    httpOnly: true,
    maxAge: jwt.maxAge,
    priority: "high",
    sameSite: true,
    secure: true,
  };

  // ===========================================================================
  // Login Route
  // ===========================================================================

  router.post("/security/access/login", async (req, res, next) => {
    try {
      const [{ username, password }] = decode(req.body) as [LoginRequest];

      const user = await findByCredentials(username, password);

      if (!user) {
        sendMsgPack(res, failLogin, 401);
        return;
      }

      const token = await jwt.generateToken(user);

      res.cookie(AUTH_TOKEN_COOKIE, token, cookieOptions);

      sendMsgPack(res, user);
    } catch (error) {
      next(error);
    }
  });

  // ===========================================================================
  // Session Check Route
  // ===========================================================================

  router.post("/security/access/isAuthenticated", async (req, res, next) => {
    try {
      const refreshToken = getCookie(req.headers.cookie);

      if (!refreshToken) {
        sendMsgPack(res, AUTH_FAILED_MESSAGE, 401);
        return;
      }

      const payload = await jwt.verifyToken(refreshToken);

      // Remove standard JWT claims before regenerating
      // jose will add them automatically with updated values
      const { exp, iat, iss, aud, nbf, jti, sub, ...userData } = payload;

      const token = await jwt.generateToken(userData);

      res.clearCookie(AUTH_TOKEN_COOKIE);
      res.cookie(AUTH_TOKEN_COOKIE, token, cookieOptions);

      sendMsgPack(res, userData);
    } catch (error) {
      console.error(error);
      res.clearCookie(AUTH_TOKEN_COOKIE);

      sendMsgPack(res, failLogin, 401);
    }
  });

  // ===========================================================================
  // Logout Route
  // ===========================================================================

  router.post("/security/access/logout", async (req, res) => {
    res.clearCookie(AUTH_TOKEN_COOKIE);

    sendMsgPack(res, { payload: "Sesión terminada" });
  });

  // ===========================================================================
  // API Auth Guard (protects all non-public POST routes)
  // ===========================================================================

  router.post(/^\/(?!public).*$/, async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    if (!token) {
      sendMsgPack(res, failLogin, 401);
      return;
    }

    try {
      const { id } = (await jwt.verifyToken(token)) as { id: string | number };

      const user = await findById(
        typeof id === "string" ? parseInt(id) : id
      );

      if (!user) {
        sendMsgPack(res, failLogin, 401);
        return;
      }

      const context: IContext = { ...user, session: new Map() };
      runContext(context, next);
    } catch (error) {
      sendMsgPack(res, failLogin, 401);
    }
  });

  // ===========================================================================
  // Login Page Route (redirects authenticated users)
  // ===========================================================================

  router.get("/login", async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    if (!token) {
      next();
      return;
    }

    try {
      const verified = await jwt.verifyToken<IUserSession>(token);
      const context: IContext = { ...verified, session: new Map() };
      runContext(context, next);

      res.redirect("/cms");
    } catch (error) {
      next();
    }
  });

  // ===========================================================================
  // CMS Route Guard (requires authentication)
  // ===========================================================================

  router.get(/^\/cms$/, async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    if (!token) {
      res.redirect("/login");
      return;
    }

    try {
      const verified = await jwt.verifyToken<IUserSession>(token);
      const context: IContext = { ...verified, session: new Map() };
      runContext(context, next);
    } catch (error) {
      res.redirect("/login");
    }
  });

  return router;
}

// ============================================================================
// Default Production Instance
// ============================================================================

import { findUserByCredentials, findUserById } from "#svc/security/user";

/**
 * Creates a pre-configured auth middleware for production use.
 *
 * This is a convenience function that uses the production user services.
 * For unit testing or custom configurations, use `createAuthMiddleware` directly.
 *
 * @param secret - JWT secret key
 * @returns Express router with authentication routes
 */
export default function defineAuth(secret: string) {
  return createAuthMiddleware({
    secret,
    findByCredentials: findUserByCredentials,
    findById: findUserById,
  });
}

// Re-export context for external use
export const user = ctx;

// Re-export types from context for convenience
export type { IContext, IUserSession };
