import { encode } from "../../utils/msgpack";
import { MSGPACK_FIELD, type Paths } from "./consts"

export function encodeBrowser(args: unknown[]): unknown[] {
    if (args.find((arg) => isFormData(arg))) {
        return args
    }

    const formData = new FormData();

    formData.append(MSGPACK_FIELD, new Blob([encode(args)]));

    const files = getFilesBrowser(args);
    const paths: Paths[] = [];

    for (let i = 0; i < files.length; i++) {
        const [path, file] = files[i];

        paths[i] = path;

        formData.append(MSGPACK_FIELD, file);
    }

    formData.append(MSGPACK_FIELD, new Blob([encode(paths)]));

    return [formData];
}

function isFormData(arg: unknown): arg is FormData {
    return arg instanceof FormData
}


export function getFilesBrowser(
    payload: unknown,
    paths: Paths = [],
    files: Array<[Paths, File]> = []
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