import { decode, encode } from "#shared/msgpackr";
import {
  CONTENT_TYPES,
  MSGPACK_FILE_FIELD,
  MSGPACK_FILE_NAME,
} from "#shared/rpc";

// Determines the base URL depending on the environment (production or development)
const baseURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000/"
    : location.origin;
const credentials =
  process.env.NODE_ENV === "development" ? "include" : "same-origin";

export default function makeClientRpc(pathname: string) {
  const url = new URL(pathname, baseURL).toString();

  return async (...args: unknown[]) => {
    const body = prepareBody(args) as BodyInit;

    const headers: HeadersInit = {
      Accept: CONTENT_TYPES.MSGPACK,
    };

    const res = await fetch(url, {
      method: "POST",
      credentials,
      headers,
      body,
    });

    if (res.headers.get("content-type") !== "application/msgpack") {
      throw new Error(`unsupport responde ${res.headers.get("content-type")}`);
    }

    const buffer: any = await res.arrayBuffer();

    const payload = decode(buffer);

    if (res.status === 200) {
      return payload;
    }

    throw payload;
  };
}

export function prepareBody(args: unknown[]): unknown {
  const argsBuffer = encode(args) as any;

  const formData = new FormData();

  formData.append(
    MSGPACK_FILE_FIELD,
    new Blob([argsBuffer], { type: CONTENT_TYPES.MSGPACK }),
    MSGPACK_FILE_NAME,
  );

  const paths: Paths[] = [];

  for (const [path, file] of getFilesBrowser(args)) {
    paths.push(path);
    formData.append(MSGPACK_FILE_FIELD, file);
  }

  const pathsBuffer = encode(paths) as any;

  formData.append(
    MSGPACK_FILE_FIELD,
    new Blob([pathsBuffer], { type: CONTENT_TYPES.MSGPACK }),
    MSGPACK_FILE_NAME,
  );

  return formData;
}

export function getFilesBrowser(
  payload: unknown,
  paths: Paths = [],
  files: Array<[Paths, File]> = [],
) {
  if (payload == null || typeof payload !== "object") {
    return files;
  }

  for (const [key, value] of Object.entries(payload)) {
    const segment = Array.isArray(payload) ? Number(key) : key;
    const currentPath: Paths = [...paths, segment];

    if (isPlainObject(value) || Array.isArray(value)) {
      getFilesBrowser(value, currentPath, files);
    }

    if (value instanceof File) {
      files.push([currentPath, value]);
      continue;
    }
  }

  return files;
}

/** Comprueba si un valor es un objeto literal (no instancia). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    (value as object).constructor === Object
  );
}

/**
 * Types
 */
type Paths = Array<string | number>;
