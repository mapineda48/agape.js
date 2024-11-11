import express from "express";
import rpc from "./rpc";

export default async function app() {
    const app = express();

    app.get("/express", (req, res) => res.send("Hello from expressjs"))
    app.use(await rpc(__filename));

    return Promise.resolve(app);
}