const EXT_FILE = 44;
export const extensionCodecError = {
    Class: Error,
    type: EXT_FILE,
    pack: (error) => {
        return new TextEncoder().encode(error.message);
    },
    unpack: (buffer) => {
        return new Error(new TextDecoder().decode(buffer));
    },
};
