// src/msgpack.ts
import { pack, unpack, addExtension } from 'msgpackr';
import { extensionCodecDecimal } from '../data/Decimal';

// 1) Registramos *globalmente* todas las extensiones
addExtension(extensionCodecDecimal);

// 2) Reexportamos pack/unpack como encode/decode
export function encode(value: unknown) {
    return pack(value);
}

export function decode<T = unknown>(buffer: ArrayBuffer | Uint8Array): T {
    return unpack(buffer);
}

export const contentType = "application/msgpack";