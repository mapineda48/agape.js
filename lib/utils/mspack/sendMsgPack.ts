import type { Response, } from "express";
import { encode } from ".";
import { CacheRpc } from "#lib/services/cache/CacheManager";

export default function sendMsgPack(res: Response, payload: unknown, status = 200) {
    const body = payload instanceof CacheRpc ? payload.getPayload() : encode(payload);

    res.set("Content-Type", "application/msgpack");
    res.status(status).send(body);
}