import express, { type Response } from "express";

import Jwt from "./Jwt";
import webSession, { initSession } from "./session";
//import { findUser } from "#svc/staff/access";
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

  router.post("/access/login", async (req, res, next) => {
    try {
      const [username, password] = decode(req.body) as [
        username: string,
        password: string
      ];

      const user = {};

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
  router.post("/access/isAuthenticated", async (req, res, next) => {
    try {
      const refreshToken = getCookie(req.headers.cookie);

      if (!refreshToken) {
        sendMsgPack(res, "Falló Autenticación", 401);
        return;
      }

      const payload = await jwt.verifyToken(refreshToken);

      delete payload.exp;
      delete payload.iat;

      const token = await jwt.generateToken(payload);

      res.clearCookie(AuthTokenCookie);
      res.cookie(AuthTokenCookie, token, cookieOptions); // Establecer la cookie

      sendMsgPack(res, payload);
    } catch (error) {
      console.error(error);
      res.clearCookie(AuthTokenCookie);

      sendMsgPack(res, failLogin, 401);
    }
  });

  router.post("/access/logout", async (req, res) => {
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
      const verified: any = await jwt.verifyToken(token);
      initSession(verified, next);
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
      initSession(verified, next);

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
      initSession(verified, next);
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

export const user = webSession;

/**
 * Types
 */
type Access = [username: string, password: string];

export interface Options {
  secret: string;
}
