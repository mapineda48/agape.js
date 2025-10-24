import os from "node:os";
import { IncomingForm } from "formidable";
import { decode } from "#utils/msgpack";
import path from "node:path";
import fs from "node:fs";
import type { Request } from "express";

const uploadDir = os.tmpdir();

export async function parseArgs(req: Request): Promise<unknown[]> {
    const contentType = req.headers.accept;

    const payload = req.body;

    if (contentType === "application/msgpack") {
        return Promise.resolve(decode<unknown[]>(payload));
    }

    if (contentType !== "multipart/form-data") {
        throw new Error("unsupport content type");
    }

    const uploadedFiles: any[] = [];
    const chunks: Buffer[] = [];

    const form = new IncomingForm({
        uploadDir,    // usa el tempdir del sistema
        keepExtensions: true       // conserva la extensión original
    });

    // 2) Intercepta el part msgpack: decodifica en memoria y NO lo guarda
    form.onPart = function (part) {
        if (part.mimetype !== 'application/msgpack') {
            // Para todo lo demás, usa el handler por defecto (dispara fileBegin, etc.)
            this._handlePart(part);
            return;
        }

        part.on('data', chunk => chunks.push(chunk));
    };

    // Antes de que empiece la escritura, cambia la ruta al tempdir+UUID
    form.on('fileBegin', (fieldName, file) => {

        const ext = path.extname(file.originalFilename ?? "");             // .jpg, .png, .pdf…
        const newName = crypto.randomUUID() + ext;                  // e.g. 'f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf'
        const filepath = path.join(uploadDir, newName);
        file.filepath = path.join(uploadDir, newName);

        // Guardamos metadata para inyectarlo luego
        uploadedFiles.push({
            paths: JSON.parse(decodeURIComponent(fieldName)),
            file: {
                name: newName,
                type: file.mimetype,
                stream: () => fs.createReadStream(filepath)
            }
        });
    });


    return new Promise((res, rej) => {
        form.parse(req, (formError) => {
            if (formError) {
                rej(formError)
                return;
            }

            try {
                const msgpackBuffer = Buffer.concat(chunks);
                const payload: any = decode<unknown[]>(new Uint8Array(msgpackBuffer));

                for (const uploadedFile of uploadedFiles) {
                    const { paths, file } = uploadedFile;

                    const path = paths[paths.length - 1];

                    const obj = paths.slice(0, -1).reduce((acc: any, key: any) => acc[key], payload);

                    obj[path] = file;
                }

                res(payload);
            } catch (error) {
                rej(error);
            }
        });
    })
}