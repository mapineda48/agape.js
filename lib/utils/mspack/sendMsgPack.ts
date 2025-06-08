import type { Response, } from "express";
import { encode } from ".";

export default function sendMsgPack(res: Response, data: unknown, status = 200) {
    res.set("Content-Type", "application/msgpack");
    res.status(status).send(encode(data));
}