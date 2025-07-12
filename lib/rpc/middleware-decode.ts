import os from "node:os";
import { IncomingForm } from "formidable";
import type { NextFunction, Request, Response } from "express";
import { decode } from "../utils/msgpack";
import sendMsgPack from "#utils/msgpack/sendMsgPack";
import path from "node:path";
import fs from "fs-extra";
import logger from "#lib/log/logger";

const uploadDir = os.tmpdir();

export default function middlewareParseClientData(req: Request, res: Response, next: NextFunction) {
    const accepts = req.headers.accept?.includes('application/msgpack');

    if (!accepts) {

        next();
        return;
    }

    const contentType = req.get("Content-Type");

    if (contentType === "application/msgpack") {
        res.status(202);
        req.body = decode(req.body);
        next();
        return;
    }

    if (!contentType?.startsWith("multipart/form-data")) {

        next();
        return;
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

    form.parse(req, (errorFormidable) => {
        if (errorFormidable) {
            logger.error("❌ Error en la carga FormData\n", errorFormidable);
            sendMsgPack(res, "❌ Error en la carga", 500)
            return;
        }

        try {
            const msgpackBuffer = Buffer.concat(chunks);
            const payload: any = decode(new Uint8Array(msgpackBuffer));

            for (const uploadedFile of uploadedFiles) {
                const { paths, file } = uploadedFile;

                const path = paths[paths.length - 1];

                const obj = paths.slice(0, -1).reduce((acc: any, key: any) => acc[key], payload);

                obj[path] = file;
            }

            req.body = payload;
            res.status(202);
            next();
        } catch(error) {
            logger.error("❌ Error en la carga FormData\n", error);
            sendMsgPack(res, "❌ Error en la carga", 500)
        }
    });

}