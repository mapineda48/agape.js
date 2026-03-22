import os from "node:os";
import { openAsBlob } from "node:fs";
import {
  IncomingForm,
  type Part,
  type File as FormidableFile,
} from "formidable";
import { decode } from "../msgpackr.ts";
import type { RpcRequest } from "./types.ts";
import { CONTENT_TYPES } from "../rpc.ts";

/** Directory for temporary file uploads */
const UPLOAD_DIR = os.tmpdir();

/** Path segments to locate a value within nested objects/arrays */
type PropertyPath = (string | number)[];

/**
 * Decodes RPC arguments from a multipart request.
 *
 * Handles:
 * 1. MessagePack-encoded arguments
 * 2. File uploads with path metadata for reassembly
 *
 * @param req - The incoming RPC request
 * @returns Decoded arguments with files placed at their original positions
 */
export async function decodeArgs(req: RpcRequest): Promise<unknown[]> {
  const form = new IncomingForm({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
  });

  const buffers: Buffer[][] = [];

  form.onPart = function (part: Part) {
    if (part.mimetype === CONTENT_TYPES.MSGPACK) {
      // Collect MessagePack data chunks
      buffers.push(collectMsgpackData(part));
    } else {
      this._handlePart(part);
    }
  };

  const openingFiles: Promise<File>[] = [];

  form.on("file", (_name: string, file: FormidableFile) => {
    openingFiles.push(
      openAsBlob(file.filepath).then((blob) => {
        return new File([blob], file.originalFilename!, {
          type: file.mimetype!,
        });
      }),
    );
  });

  await form.parse(req);

  const files = await Promise.all(openingFiles);

  const [argsBuffer, pathsBuffer] = buffers;

  const args = decode<unknown[]>(Buffer.concat(argsBuffer));
  const paths = decode<PropertyPath[]>(Buffer.concat(pathsBuffer));

  // Reassemble files at their original positions in the args structure
  for (let i = 0; i < files.length; i++) {
    setValueAtPath(args, paths[i], files[i]);
  }

  return args;
}

/**
 * Sets a value at a nested path within an object/array structure.
 */
function setValueAtPath(
  root: unknown,
  path: PropertyPath,
  value: unknown,
): void {
  if (path.length === 0) return;

  const targetKey = path[path.length - 1];
  const parentPath = path.slice(0, -1);

  // Navigate to the parent of the target location
  let current = root as Record<string | number, unknown>;
  for (const key of parentPath) {
    current = current[key] as Record<string | number, unknown>;
  }

  // Set the value at the target location
  current[targetKey] = value;
}

/**
 * Collects MessagePack data chunks from a form part.
 */
function collectMsgpackData(part: Part): Buffer[] {
  const chunks: Buffer[] = [];

  part.on("data", (chunk: Buffer) => chunks.push(chunk));

  return chunks;
}
