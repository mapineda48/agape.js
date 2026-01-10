import express, { type Response } from "express";

import Jwt from "./Jwt";
import ctx, { runContext } from "../context";
import { findUserByCredentials, findUserById } from "#svc/security/user";
import { decode, encode } from "#utils/msgpack";

const failLogin = new Error("Falló Autenticación");

const AuthTokenCookie = "auth_token";

export default function defineAuth(secret: string) {
  const router = express.Router();
  const jwt = new Jwt(secret);

  const cookieOptions: express.CookieOptions = {
    httpOnly: true,
    maxAge: jwt.maxAge,
    priority: "high",
    sameSite: true,
    secure: true,
  };

  router.post("/security/access/login", async (req, res, next) => {
    try {
      const [{ username, password }] = decode(req.body) as [LoginRequest];

      const user = await findUserByCredentials(username, password);

      if (!user) {
        sendMsgPack(res, failLogin, 401);
        return;
      }


      const token = await jwt.generateToken(user);

      res.cookie(AuthTokenCookie, token, cookieOptions); // Establecer la cookie

      sendMsgPack(res, user);
    } catch (error) {
      next(error);
    }
  });
  router.post("/security/access/isAuthenticated", async (req, res, next) => {
    try {
      const refreshToken = getCookie(req.headers.cookie);

      if (!refreshToken) {
        sendMsgPack(res, "Falló Autenticación", 401);
        return;
      }

      const payload = await jwt.verifyToken(refreshToken);

      // Remover claims estándar de JWT antes de regenerar
      // jose los añadirá automáticamente con valores actualizados
      const { exp, iat, iss, aud, nbf, jti, sub, ...userData } = payload;

      const token = await jwt.generateToken(userData);

      res.clearCookie(AuthTokenCookie);
      res.cookie(AuthTokenCookie, token, cookieOptions); // Establecer la cookie

      sendMsgPack(res, userData);
    } catch (error) {
      console.error(error);
      res.clearCookie(AuthTokenCookie);

      sendMsgPack(res, failLogin, 401);
    }
  });

  router.post("/security/access/logout", async (req, res) => {
    res.clearCookie(AuthTokenCookie);

    sendMsgPack(res, { payload: "Sesión terminada" });
  });

  //API AUTH
  router.post(/^\/(?!public).*$/, async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    if (!token) {
      sendMsgPack(res, failLogin, 401);
      return;
    }

    try {
      const { id } = await jwt.verifyToken(token) as any;

      const user = await findUserById(parseInt(id));

      if (!user) {
        sendMsgPack(res, failLogin, 401);
        return;
      }

      runContext({ ...user, session: new Map() }, next);
    } catch (error) {
      sendMsgPack(res, failLogin, 401);
    }
  });

  router.get("/login", async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    if (!token) {
      next();
      return;
    }

    try {
      const verified: any = await jwt.verifyToken(token);
      runContext(verified, next);

      res.redirect("/cms");
    } catch (error) {
      next();
    }
  });

  router.get(/^\/cms$/, async (req, res, next) => {
    const token = getCookie(req.headers.cookie);

    if (!token) {
      res.redirect("/login");
      return;
    }

    try {
      const verified: any = await jwt.verifyToken(token);
      runContext(verified, next);
    } catch (error) {
      res.redirect("/login");
    }
  });

  return router;
}

export function getCookie(header?: string) {
  if (!header) {
    return;
  }

  const [, token] = header.match(/auth_token=([^;]+)/) ?? [];

  return token;
}

function sendMsgPack(res: Response, payload: unknown, status = 200) {
  const body = encode(payload);

  res.set("Content-Type", "application/msgpack");
  res.status(status).send(body);
}

export const user = ctx;

/**
 * Types
 */
type Access = [username: string, password: string];

export interface Options {
  secret: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
