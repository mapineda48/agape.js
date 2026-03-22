import type { Extension } from 'msgpackr/unpack';

const EXT_ERROR = 44

export const extensionCodecError: Extension = {
    Class: Error,
    type: EXT_ERROR,

    pack: (error: Error) => {
        return new TextEncoder().encode(error.message)
    },

    unpack: (buffer: Uint8Array) => {
        return new Error(new TextDecoder().decode(buffer));
    },
}
