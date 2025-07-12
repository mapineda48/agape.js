import type { Extension } from 'msgpackr';

const EXT_FILE = 44

export const extensionCodecError: Extension = {
    Class: Error,
    type: EXT_FILE,

    pack: (error: Error) => {
        return new TextEncoder().encode(error.message)
    },

    unpack: (buffer: Uint8Array) => {
        return new Error(new TextDecoder().decode(buffer));
    },
}
