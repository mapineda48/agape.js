import { decode, encode } from "../utils/msgpack";

// Determines the base URL depending on the environment (production or development)
const baseURL = process.env.NODE_ENV === "development" ? "http://localhost:3000/" : location.origin;
const credentials = process.env.NODE_ENV === "development" ? "include" : "same-origin";

export default function makeClientRpc(pathname: string) {
    const url = new URL(pathname, baseURL).toString();

    return async (...args: unknown[]) => {
        const body = prepareBody(args);

        const headers: HeadersInit = { "Accept": "application/msgpack" };

        if (!(body instanceof FormData)) {
            headers["Content-Type"] = 'application/msgpack';
        }

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body,
            credentials,

        });

        const buffer = await res.arrayBuffer();

        const payload = decode(buffer);

        if (res.status === 200) {
            return payload;
        }

        throw payload;
    }
}

export function prepareBody(args: unknown[]) {
    const files = getFilesBrowser(args)

    if (!files.length) {
        return encode(args);
    }

    const formData = new FormData();

    formData.append("msgpack", new Blob([encode(args)], { type: "application/msgpack" }), "metadata.msgpack");

    files.forEach(([name, file]) => formData.append(JSON.stringify(name), file));

    return formData;
}

export function getFilesBrowser(payload: unknown, paths: Paths = [], files: Array<[Paths, File]> = []) {
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

    return files
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