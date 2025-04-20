import os from "node:os";
import fs from "fs-extra";
import _ from "lodash";
import formidable, { Fields, Files } from "formidable";
import { Request } from "express";

const ArgsKey = "";
const uploadDir = os.tmpdir();

export async function parseFormData<T extends unknown[] = unknown[]>(req: Request) {
    const form = formidable({ uploadDir });

    const payload = await new Promise<[Fields, Files]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve([fields, files]);
        });
    });

    return parseArgs(payload) as T;
}

export function parseArgs([fields, files]: [Fields, Files]): unknown[] {
    const [json, datesJson] = fields[ArgsKey] ?? [];

    if (!json) {
        throw new Error("unknown form data");
    }

    // Primitive types
    const args: unknown[] = JSON.parse(json);

    // Date type
    const dates: [string, string] = JSON.parse(datesJson);

    dates.forEach(([path, date]) => _.set(args, JSON.parse(path), new Date(date)));

    // File Type
    Object.entries(files).map(([path, file]) => _.set(args, JSON.parse(path), toFileWeb(file)));

    return args;
}

// server interface to simulate api browser  file from formidable file
export function toFileWeb([input]: formidable.File[] = []) {
    const file: unknown = {
        name: input.originalFilename || "",
        size: input.size,
        type: input.mimetype || "",

        arrayBuffer: function arrayBuffer() {
            return fs
                .readFile(input.filepath)
                .then((res) =>
                    res.buffer.slice(res.byteOffset, res.byteOffset + res.byteLength)
                );
        },

        slice: notImplementedError,

        stream: function stream() {
            return fs.createReadStream(input.filepath);
        },

        text: notImplementedError,
    };

    return file as File;
}

function notImplementedError(): void {
    throw new Error("not implemented error Date method on server");
}