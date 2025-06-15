type FileInit = {
    name?: string;
    type?: string;
    lastModified?: number;
};

export class PolyfilledFile {
    public readonly name: string;
    public readonly type: string;
    public readonly lastModified: number;
    private readonly _data: Uint8Array;

    constructor(data: BlobPart[], name = "untitled", options: FileInit = {}) {
        const buffers = data.map((part) => {
            if (typeof part === "string") {
                return new TextEncoder().encode(part);
            }
            if (part instanceof ArrayBuffer) {
                return new Uint8Array(part);
            }
            if (ArrayBuffer.isView(part)) {
                return new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
            }
            throw new TypeError("Unsupported part type in PolyfilledFile");
        });

        const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
        this._data = new Uint8Array(totalLength);
        let offset = 0;
        for (const b of buffers) {
            this._data.set(b, offset);
            offset += b.length;
        }

        this.name = name;
        this.type = options.type ?? "";
        this.lastModified = options.lastModified ?? Date.now();
    }

    get size(): number {
        return this._data.length;
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
        return this._data.buffer.slice(
            this._data.byteOffset,
            this._data.byteOffset + this._data.byteLength
        );
    }

    slice(start?: number, end?: number): Blob {
        const slice = this._data.slice(start, end);
        return new PolyfilledFile([slice], this.name, {
            type: this.type,
            lastModified: this.lastModified,
        }) as any;
    }

    // Compatibilidad mínima con Blob
    stream(): ReadableStream<Uint8Array> {
        const data = this._data;
        return new ReadableStream({
            start(controller) {
                controller.enqueue(data);
                controller.close();
            },
        });
    }

    text(): Promise<string> {
        return Promise.resolve(new TextDecoder().decode(this._data));
    }
}


let MyFile: typeof File;

if (typeof File !== "undefined") {
    MyFile = File; // Navegador
} else {
    MyFile = PolyfilledFile as any; // Node.js
}

// Uso universal:
const archivo = new MyFile(["hola mundo"], "ejemplo.txt", { type: "text/plain" });
console.log(archivo.name, archivo.type, archivo.size);
const contenido = await archivo.text(); // "hola mundo"
