/**
 * Parse Arguments Module
 *
 * Parses incoming RPC request arguments from either:
 * - MessagePack encoded body
 * - Multipart form-data with files and MessagePack payload
 */

import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { IncomingForm, type Part, type File as FormidableFile } from "formidable";
import { decode } from "#utils/msgpack";
import type { RpcRequest, UploadedFileMetadata } from "./types";
import { CONTENT_TYPES } from "./constants";

/** Directory for temporary file uploads */
const UPLOAD_DIR = os.tmpdir();

/**
 * Parses request arguments from an RPC request.
 *
 * Supports two content types:
 * 1. `application/msgpack`: Direct MessagePack-encoded array of arguments
 * 2. `multipart/form-data`: Form with files and a MessagePack payload part
 *
 * @param req - The Express request object
 * @returns Promise resolving to an array of parsed arguments
 * @throws Error if content type is unsupported
 */
export async function parseArgs(req: RpcRequest): Promise<unknown[]> {
    const contentType = req.headers["content-type"];

    if (contentType === CONTENT_TYPES.MSGPACK) {
        return parseMsgpackBody(req.body);
    }

    if (contentType?.startsWith(CONTENT_TYPES.MULTIPART)) {
        return parseMultipartForm(req);
    }

    throw new Error(`Unsupported content type: ${contentType}`);
}

/**
 * Decodes a MessagePack-encoded body.
 *
 * @param body - Raw buffer containing MessagePack data
 * @returns Decoded array of arguments
 */
function parseMsgpackBody(body: Buffer): unknown[] {
    return decode<unknown[]>(body);
}

/**
 * Parses a multipart form-data request.
 *
 * The form is expected to contain:
 * - One `application/msgpack` part with the main payload
 * - Zero or more file parts that will be injected into the payload
 *
 * @param req - The Express request object
 * @returns Promise resolving to parsed arguments with injected files
 */
function parseMultipartForm(req: RpcRequest): Promise<unknown[]> {
    const uploadedFiles: UploadedFileMetadata[] = [];
    const msgpackChunks: Buffer[] = [];

    const form = createFormParser();

    // Handle msgpack part separately - decode in memory without saving
    form.onPart = function (part: Part) {
        if (part.mimetype === CONTENT_TYPES.MSGPACK) {
            collectMsgpackData(part, msgpackChunks);
        } else {
            // Use default handler for file parts (triggers fileBegin, etc.)
            this._handlePart(part);
        }
    };

    // Intercept file writes to rename with UUID and track metadata
    form.on("fileBegin", (fieldName: string, file: FormidableFile) => {
        handleFileBegin(fieldName, file, uploadedFiles);
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (error: Error | null) => {
            if (error) {
                reject(error);
                return;
            }

            try {
                const payload = decodeMsgpackChunks(msgpackChunks);
                injectFilesIntoPayload(payload, uploadedFiles);
                resolve(payload);
            } catch (parseError) {
                reject(parseError);
            }
        });
    });
}

/**
 * Creates a configured formidable form parser.
 */
function createFormParser(): InstanceType<typeof IncomingForm> {
    return new IncomingForm({
        uploadDir: UPLOAD_DIR,
        keepExtensions: true,
    });
}

/**
 * Collects MessagePack data chunks from a form part.
 */
function collectMsgpackData(part: Part, chunks: Buffer[]): void {
    part.on("data", (chunk: Buffer) => chunks.push(chunk));
}

/**
 * Handles the beginning of a file upload.
 *
 * Generates a unique filename and tracks metadata for later injection.
 */
function handleFileBegin(
    fieldName: string,
    file: FormidableFile,
    uploadedFiles: UploadedFileMetadata[]
): void {
    const extension = path.extname(file.originalFilename ?? "");
    const uniqueName = `${crypto.randomUUID()}${extension}`;
    const filepath = path.join(UPLOAD_DIR, uniqueName);

    file.filepath = filepath;

    // Parse the field name as JSON to get the path array
    const paths = JSON.parse(decodeURIComponent(fieldName));

    uploadedFiles.push({
        paths,
        file: {
            name: uniqueName,
            type: file.mimetype,
            stream: () => fs.createReadStream(filepath),
        },
    });
}

/**
 * Decodes collected MessagePack chunks into a payload array.
 */
function decodeMsgpackChunks(chunks: Buffer[]): unknown[] {
    const buffer = Buffer.concat(chunks);
    return decode<unknown[]>(new Uint8Array(buffer));
}

/**
 * Injects uploaded files into the payload at their specified paths.
 *
 * Each file's `paths` property specifies the location in the payload
 * where the file object should be placed.
 *
 * @param payload - The decoded payload array (mutated in place)
 * @param uploadedFiles - Array of file metadata with path information
 */
function injectFilesIntoPayload(
    payload: unknown[],
    uploadedFiles: UploadedFileMetadata[]
): void {
    for (const { paths, file } of uploadedFiles) {
        const targetKey = paths[paths.length - 1];
        const parentPath = paths.slice(0, -1);

        // Navigate to the parent object
        const parent = parentPath.reduce<Record<string | number, unknown>>(
            (current, key) => current[key] as Record<string | number, unknown>,
            payload as unknown as Record<string | number, unknown>
        );

        parent[targetKey] = file;
    }
}