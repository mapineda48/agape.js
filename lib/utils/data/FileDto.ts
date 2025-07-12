// src/data/FileDto.ts
import type { Extension } from 'msgpackr';

// Código de extensión para FileInMemory
export const EXT_FILE_IN_MEMORY = 42;

/**
 * Clase que almacena un archivo en memoria con nombre, tipo y datos.
 */
export default class FileInMemory {
    name: string;
    type: string;
    data: Uint8Array;

    constructor(name: string, type: string, content: Uint8Array) {
        this.name = name;
        this.type = type;
        this.data = content;
    }

    /**
     * Crea una instancia desde un File del navegador
     */
    static async fromFile(file: File): Promise<FileInMemory> {
        const buffer = await file.arrayBuffer();
        return new FileInMemory(file.name, file.type, new Uint8Array(buffer));
    }

    /**
     * Convierte a Buffer (Node.js)
     */
    toBuffer(): Buffer {
        return Buffer.from(this.data);
    }
}

/**
 * Definición de extensión para FileInMemory:
 * - pack: serializa name, type y data en un Uint8Array
 * - unpack: reconstruye FileInMemory desde el buffer
 *
 * msgpackr usará esta extensión únicamente para instancias de FileInMemory,
 * gracias a la propiedad Class.
 */
export const extensionCodecFileInMemory: Extension = {
    Class: FileInMemory,
    type: EXT_FILE_IN_MEMORY,

    pack(instance: FileInMemory): Uint8Array {
        const encoder = new TextEncoder();
        const nameBytes = encoder.encode(instance.name);
        const typeBytes = encoder.encode(instance.type);

        const nameLen = nameBytes.length;
        const typeLen = typeBytes.length;
        const contentLen = instance.data.length;

        const totalLen = 4 + nameLen + 4 + typeLen + contentLen;
        const buffer = new Uint8Array(totalLen);
        const view = new DataView(buffer.buffer);

        view.setUint32(0, nameLen);
        buffer.set(nameBytes, 4);

        view.setUint32(4 + nameLen, typeLen);
        buffer.set(typeBytes, 8 + nameLen);

        buffer.set(instance.data, 8 + nameLen + typeLen);

        return buffer;
    },

    unpack(buf: Uint8Array): FileInMemory {
        const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
        const decoder = new TextDecoder();

        const nameLen = view.getUint32(0);
        const name = decoder.decode(buf.slice(4, 4 + nameLen));

        const typeLen = view.getUint32(4 + nameLen);
        const type = decoder.decode(buf.slice(8 + nameLen, 8 + nameLen + typeLen));

        const data = buf.slice(8 + nameLen + typeLen);

        return new FileInMemory(name, type, data);
    }
};


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