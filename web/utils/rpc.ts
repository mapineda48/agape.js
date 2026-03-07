import { decode, encode } from "#shared/msgpackr";
import {
  CONTENT_TYPES,
  MSGPACK_FILE_FIELD,
  MSGPACK_FILE_NAME,
} from "#shared/rpc";

// Determines the base URL depending on the environment (production or development)
const baseURL =
  typeof window === "undefined"
    ? "http://localhost:3000/"
    : process.env.NODE_ENV === "development"
      ? "http://localhost:3000/"
      : location.origin;
const credentials =
  process.env.NODE_ENV === "development" ? "include" : "same-origin";

export default function makeClientRpc<A extends unknown[], R>(
  pathname: string,
) {
  const url = new URL(pathname, baseURL).toString();

  return async (...args: A) => {
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

    const buffer = await res.arrayBuffer();

    const payload = decode<R>(buffer);

    if (res.status === 200) {
      return payload;
    }

    throw payload;
  };
}

export function prepareBody(args: unknown[]): FormData {
  const argsBuffer = encode(args);

  const formData = new FormData();

  formData.append(
    MSGPACK_FILE_FIELD,
    new Blob([argsBuffer.slice()], { type: CONTENT_TYPES.MSGPACK }),
    MSGPACK_FILE_NAME,
  );

  const paths: Paths[] = [];

  for (const [path, file] of getFilesBrowser(args)) {
    paths.push(path);
    formData.append(MSGPACK_FILE_FIELD, file);
  }

  const pathsBuffer = encode(paths);

  formData.append(
    MSGPACK_FILE_FIELD,
    new Blob([pathsBuffer.slice()], { type: CONTENT_TYPES.MSGPACK }),
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
