import express from "express";
import auth from "./auth/server";
import connectService from "./rpc";

export default async function prepareBackend() {
    const backend = express.Router();

    backend.get("/express", (req, res) => {
        res.send("Hello from expressjs");
    });

    backend.use(auth({
        secret: __filename,
        admin: {
            username: "admin", password: "admin"
        }
    }));

    backend.use(await connectService());

    return Promise.resolve(backend);
}