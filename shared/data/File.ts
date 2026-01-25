import type { Extension } from 'msgpackr/unpack';

/**
 * Browser file
 * Esta extension se usa tanto en el navegador como el servidor, en caso de estar en el servidor se moquea File class;
 */
export const EXT_FILE_BROWSER = 43;

export const extensionCodecFileBrowser: Extension = {
    Class: File ?? class File { },
    type: EXT_FILE_BROWSER,
    pack() {
        return new Uint8Array(0);
    },

    unpack(buf: Uint8Array) {
        return null;
    }
}