import path from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import { findService, type MatchService, toPublicUrl } from "./services";
import { decode } from "../mspack";
import sendMsgPack from "../mspack/sendMsgPack";

export default async function findServices() {
    const route = express.Router();

    const chunks = findService();

    await Promise.all(chunks.map(toRpc(route)))

    return Promise.resolve(route);
}

function toRpc(route: express.Router): (svc: MatchService) => Promise<void> {
    return async ({ file, relativePath }) => {
        const module = await import(pathToFileURL(file).href);

        const moduleUrl = toPublicUrl(relativePath);

        Object
            .entries(module)
            .forEach(([exportName, fn]) => {
                if (typeof fn !== "function") {
                    return;
                }

                const endpoint = path.posix.join(
                    "/",
                    moduleUrl,
                    exportName !== "default" ? exportName : ""
                );

                route.post(endpoint, prepareRpc(fn));
            });
    };
}

function prepareRpc(fn: Function): express.RequestHandler {
    return async (req, res, next) => {
        try {
            const args = decode(req.body) as unknown[];
            const payload = await fn.call(null, ...args);

            sendMsgPack(res, payload);
        } catch (error) {
            console.error(error);
            next(error);
        }
    };
}