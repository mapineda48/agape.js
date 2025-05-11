import express from "express";
import Jwt from "./Jwt";
import webSession, { initSession } from "./session";
import { parseArgs } from "../rpc/parseArgs";
import { toResponse } from "#lib/utils/form-data";
import { findUser } from "#svc/staff/access";


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
            const [username, password] = await parseArgs<Access>(req);

            const user = await findUser(username, password);

            if (!user) {
                res.status(401).json("Falló Autenticación");
                return;
            }

            const token = await jwt.generateToken(user);

            res.cookie(AuthTokenCookie, token, cookieOptions); // Establecer la cookie


            res.status(200).json(toResponse({ payload: user }));
        } catch (error) {
            next(error);
        }
    });
    router.post("/access/isAuthenticated", async (req, res, next) => {
        try {
            const refreshToken = getCookie(req.headers.cookie);

            if (!refreshToken) {
                res.status(401).json("Falló Autenticación");
                return;
            }

            const payload = await jwt.verifyToken(refreshToken);

            delete payload.exp;
            delete payload.iat;

            const token = await jwt.generateToken(payload);

            res.clearCookie(AuthTokenCookie);
            res.cookie(AuthTokenCookie, token, cookieOptions); // Establecer la cookie

            res.json(toResponse({ payload }));
        } catch (error) {
            console.error(error);
            res.clearCookie(AuthTokenCookie);

            res.status(401).json("Falló Autenticación");
        }
    });

    router.post("/access/logout", async (req, res) => {
        res.clearCookie(AuthTokenCookie);
        res.status(200).json(toResponse({ payload: "Sesión terminada" }));
    });

    //API AUTH
    router.post(/^\/(?!public).*$/, async (req, res, next) => {
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

export const user = webSession;

/**
 * Types
 */
type Access = [username: string, password: string];

export interface Options {
    secret: string;
}