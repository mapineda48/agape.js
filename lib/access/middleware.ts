import express, { Request, Response } from "express";
import { parseFormData } from "../form-data/middleware";
import Jwt from "./Jwt";
import webSession, { initSession } from "./session";

const AuthTokenCookie = "auth_token";

export default function defineAuth({ secret, admin, sameSite }: Options) {
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
            const [username, password] = await parseFormData<Access>(req);

            const isAdmin = username === admin.username;
            const isPassword = password === admin.password;

            if (!isAdmin || !isPassword) {
                res.status(401).json("Falló Autenticación");
                return;
            }

            const user = { id: -1, fullName: username, avatar: "" }; // Ejemplo de usuario

            const token = await jwt.generateToken(user);

            console.log(token);
            res.cookie(AuthTokenCookie, token, cookieOptions); // Establecer la cookie
            res.status(200).json(success(user));
        } catch (error) {
            next(error);
        }
    });
    console.log("ïsaut");
    router.post("/access/isAuthenticated", async (req, res, next) => {
        console.log("ïsaut");
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

            res.json(success(payload));
        } catch (error) {
            console.error(error);
            res.clearCookie(AuthTokenCookie);

            res.status(401).json("Falló Autenticación");
        }
    });

    router.post("/access/logout", async (req, res) => {
        res.clearCookie(AuthTokenCookie);
        res.status(200).json(success({ message: "Sesión terminada" }));
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

function success(payload: unknown) {
    return [payload, []];
}

export const user = webSession;

/**
 * Types
 */
type Access = [username: string, password: string];

export interface Options {
    sameSite: boolean;
    secret: string;
    admin: {
        username: string;
        password: string
    }
}