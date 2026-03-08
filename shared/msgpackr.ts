import { pack, unpack, addExtension } from 'msgpackr';
import { extensionCodecDecimal } from './data/Decimal';
import { extensionCodecDateTime } from './data/DateTime';
import { extensionCodecFileBrowser } from './data/File';
import { extensionCodecError } from './data/Error';

// 1) Registramos *globalmente* todas las extensiones
addExtension(extensionCodecDecimal);
addExtension(extensionCodecDateTime);
addExtension(extensionCodecFileBrowser);
addExtension(extensionCodecError);

// 2) Reexportamos pack/unpack como encode/decode
export function encode(value: unknown): Uint8Array {
  return pack(value);
}

export function decode<T = unknown>(buffer: Uint8Array): T {
  return unpack(buffer);
}

export const contentType = "application/msgpack";