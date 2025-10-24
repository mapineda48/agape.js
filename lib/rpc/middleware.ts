import { encode } from "#utils/msgpack";
import path from "node:path";
import { pathToFileURL } from "node:url";
import express from "express";
import parseError from "./error";
import { parseArgs } from "./parseArgs";
import { cwd, svc, toPublicUrl } from "./path";

const rpc = express.Router();

for await (const src of svc) {
    const filename = path.join(cwd, src);

    const module = await import(pathToFileURL(filename).href);

    const moduleUrl = toPublicUrl(src);

    for (const [exportName, fn] of Object.entries(module)) {
        if (typeof fn !== "function") continue;

        const endpoint = path.posix.join("/", moduleUrl, exportName !== "default" ? exportName : "");

        rpc.post(endpoint, async (req, res, next) => {
            try {
                const args = await parseArgs(req);

                const result = await fn.call(null, ...args);

                const payload = encode(result);

                res.set("Content-Type", "application/msgpack");
                res.status(200).send(payload);
            } catch (error) {
                const result = parseError(error);

                const payload = encode(result);

                res.set("Content-Type", "application/msgpack");
                res.status(400).send(payload);
            }
        });
    }
}

export default rpc;