import * as msgpack from "@msgpack/msgpack";
import { extensionCodecDecimal } from "../data/Decimal";
import { extensionCodecDateTime } from "../data/DateTime";
import { extensionCodecFile } from "../data/FileDto";
import { extensionCodecError } from "#utils/error";

const extensionCodec = new msgpack.ExtensionCodec();

extensionCodec.register(extensionCodecDecimal);
extensionCodec.register(extensionCodecDateTime);
extensionCodec.register(extensionCodecFile);
extensionCodec.register(extensionCodecError);

export function encode(value: unknown) {
    return msgpack.encode(value, { extensionCodec })
}

export function decode(buffer: ArrayLike<number> | ArrayBufferView | ArrayBufferLike) {
    return msgpack.decode(buffer, { extensionCodec })
}

