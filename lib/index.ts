import express from "express";
import log from "morgan";
import auth, { Options as Auth } from "./auth/server";
import connectService from "./rpc";

export default async function prepareBackend(option: Auth) {
    const backend = express.Router();

    backend.use("/service", log("dev"))

    backend.get("/express", (req, res) => {
        res.send("Hello from expressjs");
    });

    backend.use(auth(option));

    backend.use(await connectService());

    return Promise.resolve(backend);
}