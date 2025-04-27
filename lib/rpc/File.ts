import fs from "fs-extra";
import type { File as FormidableFile } from "formidable";
import { Readable } from "stream";

/**
 * Emula la API File del navegador a partir de un formidable.File en Node.
 */
export default class FileWeb {
    name: string;
    size: number;
    type: string;
    lastModified: number;

    constructor(private input: FormidableFile) {
        this.name = input.originalFilename ?? "";
        this.size = input.size;
        this.type = input.mimetype ?? "";
        this.lastModified = Date.now();
    }

    /** Devuelve el contenido como ArrayBuffer */
    async arrayBuffer(): Promise<ArrayBuffer> {
        const buffer = await fs.readFile(this.input.filepath);
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }

    /** No implementado en servidor */
    slice(_start?: number, _end?: number, _contentType?: string): Blob {
        throw new Error("slice() no implementado en servidor");
    }

    /** Stream de lectura del archivo */
    stream(): Readable {
        return fs.createReadStream(this.input.filepath);
    }

    /** No implementado en servidor */
    async text(): Promise<string> {
        throw new Error("text() no implementado en servidor");
    }
}