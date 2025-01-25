import express from "express";
import rpc from "./rpc";
import auth from "./auth/server";

export default async function app() {
    const app = express();

    app.get("/express", (req, res) => res.send("Hello from expressjs"));

    app.use(auth({
        secret: "__filename",
        admin: {
            username: "admin", password: "admin"
        }
    }));

    app.use(await rpc());

    return app;
}