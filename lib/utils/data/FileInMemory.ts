const EXT_FILE = 44

export default class FileInMemory {
    /** @type {string} */
    name: string
    /** @type {string} */
    type: string
    /** @type {Uint8Array} */
    data: Uint8Array

    constructor(name: string, type: string, content: Uint8Array) {
        this.name = name
        this.type = type
        this.data = content // Uint8Array
    }

    static async fromFile(file: File) {
        const buffer = await file.arrayBuffer()

        return new FileInMemory(file.name, file.type, new Uint8Array(buffer))
    }

    toBuffer() {
        // Solo Node.js
        return Buffer.from(this.data)
    }
}

export const extensionCodecFile = {
    type: EXT_FILE,

    encode: (value: unknown) => {
        if (value instanceof FileInMemory) {
            const encoder = new TextEncoder()
            const nombre = encoder.encode(value.name)
            const tipo = encoder.encode(value.type)

            const nombreLen = nombre.length
            const tipoLen = tipo.length
            const contenidoLen = value.data.length

            const totalLen = 4 + nombreLen + 4 + tipoLen + contenidoLen
            const buffer = new Uint8Array(totalLen)
            const view = new DataView(buffer.buffer)

            view.setUint32(0, nombreLen)
            buffer.set(nombre, 4)

            view.setUint32(4 + nombreLen, tipoLen)
            buffer.set(tipo, 8 + nombreLen)

            buffer.set(value.data, 8 + nombreLen + tipoLen)

            return buffer
        }
        return null;
    },

    decode: (buffer: Uint8Array) => {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        const decoder = new TextDecoder()

        const nombreLen = view.getUint32(0)
        const nombreBytes = buffer.slice(4, 4 + nombreLen)
        const nombre = decoder.decode(nombreBytes)

        const tipoLen = view.getUint32(4 + nombreLen)
        const tipoBytes = buffer.slice(8 + nombreLen, 8 + nombreLen + tipoLen)
        const tipo = decoder.decode(tipoBytes)

        const contenido = buffer.slice(8 + nombreLen + tipoLen)

        return new FileInMemory(nombre, tipo, contenido)
    },
}
