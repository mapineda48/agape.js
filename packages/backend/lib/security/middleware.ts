/**
 * Authentication Middleware Module
 *
 * Express middleware that handles user authentication via JWT tokens.
 * Supports login, logout, session validation, and route protection.
 *
 * JWT Token Strategy:
 * - Stores id, tenant, and permissions in the token
 * - Full user data is fetched from database only when needed
 *
 * This module exports:
 * - `createAuthMiddleware`: Factory function for creating the middleware (testable)
 * - Default export: Pre-configured middleware instance for production use
 */

import express, { type Response } from "express";

import Jwt from "./Jwt";
import ctx, { type IContext } from "../context";
import { decode, encode } from "@mapineda48/agape/msgpackr";
import {
  findUserByCredentials,
  findUserById,
  type IUserSession,
} from "#svc/security/user";
import { routes } from "@mapineda48/agape/security/route";
import type { LoginRequest } from "@mapineda48/agape/security/types";

// ============================================================================
// Constants
// ============================================================================

const AUTH_TOKEN_COOKIE = "auth_token";
const AUTH_FAILED_MESSAGE = "Falló Autenticación";
const DEFAULT_TENANT = process.env.TENANT_ID ?? "agape_app_development_demo";
const DEFAULT_PERMISSIONS = ["public.*"];

// ============================================================================
// Types
// ============================================================================

/**
 * Payload stored in JWT token.
 * Includes essential session data: id, tenant, and permissions.
 */
interface JwtPayload {
  id: number;
  tenant: string;
  permissions: string[];
  [key: string]: unknown;
}

/**
 * Function to find a user by credentials.
 * @param username - User's username
 * @param password - User's password (plain text)
 * @returns User session data if credentials are valid, null otherwise
 */
export type FindByCredentials = (
  username: string,
  password: string,
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
 * Parses cookies from header string.
 * Uses a simple but robust regex-based approach.
 */
function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const pairs = header.split(";");

  for (const pair of pairs) {
    const [name, ...rest] = pair.split("=");
    if (name) {
      const key = name.trim();
      const value = rest.join("=").trim();
      if (key) cookies[key] = value;
    }
  }

  return cookies;
}

/**
 * Extracts auth token from cookie header.
 */
export function getCookie(header?: string): string | undefined {
  if (!header) {
    return;
  }

  const cookies = parseCookies(header);
  return cookies[AUTH_TOKEN_COOKIE];
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

  router.post(routes.login, async (req, res, next) => {
    try {
      const [{ username, password }] = decode(req.body) as [LoginRequest];

      const user = await findByCredentials(username, password);

      if (!user) {
        sendMsgPack(res, failLogin, 401);
        return;
      }

      // 🔐 Store essential session data in JWT
      const token = await jwt.generateToken({
        id: user.id,
        tenant: DEFAULT_TENANT,
        permissions: user.permissions,
      });

      res.cookie(AUTH_TOKEN_COOKIE, token, cookieOptions);

      // Return full user data in response (not stored in JWT)
      sendMsgPack(res, user);
    } catch (error) {
      next(error);
    }
  });

  // ===========================================================================
  // Session Check Route
  // ===========================================================================

  router.post(routes.isAuthenticated, async (req, res) => {
    try {
      const refreshToken = getCookie(req.headers.cookie);

      if (!refreshToken) {
        sendMsgPack(res, AUTH_FAILED_MESSAGE, 401);
        return;
      }

      const { id } = await jwt.verifyToken<JwtPayload>(refreshToken);

      // Fetch fresh user data from database
      const user = await findById(id);

      if (!user) {
        res.clearCookie(AUTH_TOKEN_COOKIE);
        sendMsgPack(res, failLogin, 401);
        return;
      }

      // Refresh token with updated session data
      const token = await jwt.generateToken({
        id: user.id,
        tenant: DEFAULT_TENANT,
        permissions: user.permissions,
      });

      res.clearCookie(AUTH_TOKEN_COOKIE);
      res.cookie(AUTH_TOKEN_COOKIE, token, cookieOptions);

      // Return full user data in response
      sendMsgPack(res, user);
    } catch (error) {
      console.error(error);
      res.clearCookie(AUTH_TOKEN_COOKIE);

      sendMsgPack(res, failLogin, 401);
    }
  });

  // ===========================================================================
  // Logout Route
  // ===========================================================================

  router.post(routes.logout, async (req, res) => {
    res.clearCookie(AUTH_TOKEN_COOKIE);

    sendMsgPack(res, { payload: "Sesión terminada" });
  });

  // ===========================================================================
  // API Auth Middleware (Attempts to authenticate, passes to RPC for enforcement)
  // ===========================================================================

  router.post(/.*/, async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    // Default payload for unauthenticated users
    const defaultPayload = {
      id: 0,
      tenant: "",
      permissions: DEFAULT_PERMISSIONS,
    };

    if (!token) {
      res.locals.authPayload = defaultPayload;
      next();
      return;
    }

    try {
      const payload = await jwt.verifyToken<JwtPayload>(token);

      // Expose auth payload for RPC middleware to create context
      res.locals.authPayload = {
        id: payload.id,
        tenant: payload.tenant,
        permissions: payload.permissions,
      };

      next();
    } catch {
      // Fallback to default payload on error
      res.locals.authPayload = defaultPayload;
      next();
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
      // Just verify token is valid, no context needed for redirect
      await jwt.verifyToken<JwtPayload>(token);
      res.redirect("/cms");
    } catch {
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
      // Just verify token is valid, context will be created by RPC middleware if needed
      await jwt.verifyToken<JwtPayload>(token);
      next();
    } catch {
      res.redirect("/login");
    }
  });

  return router;
}

// ============================================================================
// Default Production Instance
// ============================================================================

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

// Re-export types for convenience
export type { IContext, IUserSession };
