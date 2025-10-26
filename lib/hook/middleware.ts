import express from "express";
import { sendCommand } from "./sendCommand";

export default function useHook(secret: string) {
    const router = express.Router();

    router.post(`/${secret}/:cmd`, (req, res, next) => {
        sendCommand(req.params.cmd)
            .then(payload => {
                res.json(payload)
            })
            .catch(error => next(error))
    });

    return router;
}