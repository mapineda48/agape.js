import os from "node:os";
import formidable from "formidable";
import type { Request } from "express";
import { setPaths } from "#utils/form-data";
import DateTime from "#utils/DateTime";
import Decimal from "#utils/Decimal";
import File from "./File";

const uploadDir = os.tmpdir();

export function parseArgs<T extends unknown[] = unknown[]>(req: Request) {
    return new Promise<T>((res, rej) => {
        formidable({ uploadDir }).parse(req, (error, fields, files) => {
            if (error) {
                rej(error);
                return;
            }

            const [[json, dates, decimals]] = Object.values(fields) as string[][];

            // Primitive types
            const args: unknown[] = JSON.parse(json);

            // Date type
            JSON.parse(dates).forEach(([paths, date]: any) => setPaths(args, paths, new DateTime(date)));

            // Decimal type
            JSON.parse(decimals).forEach(([paths, decimal]: any) => setPaths(args, paths, new Decimal(decimal)));

            // File Type
            Object.entries(files).forEach(([paths, [file]]: any) => file && setPaths(args, paths, new File(file)));

            res(args as T)
        });
    })
}