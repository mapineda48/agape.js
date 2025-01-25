import express from "express";
import parseFormData from "../form/server";
import Jwt from "./Jwt";
import webSession, { initSession } from "./session";
import { Unauthorized } from "../rpc/call/error/app";
import { AvatarDemoUrl } from "./const";

const AuthTokenCookie = "auth_token";

export const path = {
  login: "/service/auth/login",
  isAuthenticated: "/service/auth/isAuthenticated",
  logout: "/service/auth/logout",
};

export default function defineAuth({ secret, admin }: Options) {
  const router = express.Router();
  const jwt = new Jwt(secret);

  const cookieOptions: express.CookieOptions = {
    httpOnly: true,
    maxAge: jwt.maxAge,
    priority: "high",
    sameSite: true,
    secure: true,
  };

  router.post(path.login, async (req, res) => {
    const [{ username, password }] = (await parseFormData(req)) as Access;

    const isAdmin = username === admin.username;
    const isPassword = password === admin.password;

    if (!isAdmin || !isPassword) {
      throw new Unauthorized("Acceso denegado");
    }

    const user = { id: -1, fullName: username, avatar: "" }; // Ejemplo de usuario

    const token = await jwt.generateToken(user);

    res.cookie(AuthTokenCookie, token, cookieOptions); // Establecer la cookie
    res.status(200).json(success(user));
  });

  router.post(path.isAuthenticated, async (req, res) => {
    const refreshToken = getCookie(req.headers.cookie);

    if (!refreshToken) {
      res.status(401).json(false);
      return;
    }

    try {
      const payload = await jwt.verifyToken(refreshToken);

      delete payload.exp;
      delete payload.iat;

      const token = await jwt.generateToken(payload);

      res.cookie(AuthTokenCookie, token, cookieOptions); // Establecer la cookie

      res.json(success(payload));
    } catch (error) {
      res.clearCookie(AuthTokenCookie);

      res.status(401).json(null);
    }
  });

  router.post(path.logout, async (req, res) => {
    res.clearCookie(AuthTokenCookie);
    res.status(200).json(success({ message: "Sesión terminada" }));
  });

  //API AUTH
  router.post(/^\/service\/(?!public).*$/, async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    if (!token) {
      res.status(401).send("Acceso denegado");
      return;
    }

    try {
      const verified: any = await jwt.verifyToken(token);
      initSession(verified, next);

    } catch (error) {
      res.status(401).send("Acceso denegado");
    }
  })

  router.get("/login", async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    if (!token) {
      next();
      return;
    }

    try {
      const verified: any = await jwt.verifyToken(token);
      initSession(verified, next);

      res.redirect("/cms")
    } catch (error) {
      next()
    }
  })

  router.get(/^\/cms$/, async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    if (!token) {
      res.redirect("/login");
      return;
    }

    try {
      const verified: any = await jwt.verifyToken(token);
      initSession(verified, next);
    } catch (error) {
      res.redirect("/login");
    }
  })

  return router;
}

export function getCookie(header?: string) {
  if (!header) {
    return;
  }

  const [, token] = header.match(/auth_token=([^;]+)/) ?? [];

  return token;
}

function success(payload: unknown) {
  return [payload, []];
}

export const user = webSession;

/**
 * Types
 */
type Access = [{ username: string; password: string }];

export interface Options {
  secret: string;
  admin: {
    username: string;
    password: string
  }
}