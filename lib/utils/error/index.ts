export class AgapeError extends Error {}

const EXT_FILE = 45

export const extensionCodecError = {
    type: EXT_FILE,

    encode: (value: unknown) => {
        if (value instanceof AgapeError) {
            return new TextEncoder().encode(value.message);
        }
        return null;
    },

    decode: (buffer: Uint8Array) => {
        return new AgapeError(new TextDecoder().decode(buffer));
    },
}
