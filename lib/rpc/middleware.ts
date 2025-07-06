import path from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import { findService, type MatchService, toPublicUrl } from "./services";
import sendMsgPack from "../utils/mspack/sendMsgPack";
import parseBody from "./middleware-decode";

export default async function findServices() {
    const route = express.Router();

    const chunks = findService();

    await Promise.all(chunks.map(svc => toRpc(route, svc)))

    return Promise.resolve(route);
}

async function toRpc(route: express.Router, { file, relativePath }: MatchService): Promise<void> {
    const module = await import(pathToFileURL(file).href);

    const moduleUrl = toPublicUrl(relativePath);

    for (const [exportName, fn] of Object.entries(module)) {
        if (typeof fn !== "function") {
            continue;
        }

        const endpoint = path.posix.join("/", moduleUrl, exportName !== "default" ? exportName : "");

        route.post(endpoint, parseBody, async (req, res, next) => {
            if (res.statusCode !== 202) {
                next();
                return;
            }

            try {
                const payload = await fn.call(null, ...req.body);

                sendMsgPack(res, payload);
            } catch (error) {
                console.error(error);
                sendMsgPack(res, error, 400)
            }
        })
    }
};

