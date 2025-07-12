// src/msgpack.ts
import { pack, unpack, addExtension } from 'msgpackr';
import { extensionCodecDecimal } from '../data/Decimal';
import { extensionCodecDateTime } from '../data/DateTime';
import { extensionCodecFileInMemory, extensionCodecFileBrowser } from '../data/File';
import { extensionCodecError } from '../error';

// 1) Registramos *globalmente* todas las extensiones
addExtension(extensionCodecDecimal);
addExtension(extensionCodecDateTime);
addExtension(extensionCodecFileInMemory);
addExtension(extensionCodecFileBrowser);
addExtension(extensionCodecError);

// 2) Reexportamos pack/unpack como encode/decode
export function encode(value: unknown): Uint8Array {
  return pack(value);
}

export function decode(buffer: Buffer | Uint8Array): unknown {
  return unpack(buffer);
}
