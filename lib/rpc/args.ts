import os from "node:os";
import { openAsBlob } from "node:fs";
import {
  IncomingForm,
  type Part,
  type File as FormidableFile,
} from "formidable";
import { decode } from "#shared/msgpackr";
import type { RpcRequest } from "./types";
import { CONTENT_TYPES } from "#shared/rpc";

/** Directory for temporary file uploads */
const UPLOAD_DIR = os.tmpdir();

export async function decodeArgs(req: RpcRequest) {
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

  form.on("file", (name: string, file: FormidableFile) => {
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
  const paths = decode<(string | number)[][]>(Buffer.concat(pathsBuffer));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = paths[i];

    const targetKey = path[path.length - 1];
    const parentPath = path.slice(0, -1);

    const parent = parentPath.reduce<Record<string | number, unknown>>(
      (current, key) => current[key] as Record<string | number, unknown>,
      args as unknown as Record<string | number, unknown>,
    );

    parent[targetKey] = file;
  }

  return args;
}

/**
 * Collects MessagePack data chunks from a form part.
 */
function collectMsgpackData(part: Part): Buffer[] {
  const chunks: Buffer[] = [];

  part.on("data", (chunk: Buffer) => chunks.push(chunk));

  return chunks;
}
