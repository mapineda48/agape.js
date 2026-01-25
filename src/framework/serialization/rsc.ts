import { decode } from "../../utils/msgpack";
import { MSGPACK_FIELD, type Paths } from "./consts";

export async function decodeRsc(customArgs: unknown[]): Promise<{ withMsgpack: boolean; args: unknown[] }> {

    const [formData] = customArgs;

    if (formData instanceof FormData) {

        const entries = formData.getAll(MSGPACK_FIELD);

        const msgpackField = entries.at(0);
        const pathsPrefix = entries.at(-1);

        if (!isFile(msgpackField) || !isFile(pathsPrefix)) {
            return { withMsgpack: false, args: customArgs };
        }

        const files = entries.slice(1, -1);

        const payload = decode<unknown[]>(await msgpackField.arrayBuffer());
        const paths = decode<Paths[]>(await pathsPrefix.arrayBuffer());

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const path = paths[i];

            const targetKey = path[path.length - 1];
            const parentPath = path.slice(0, -1);

            const parent = parentPath.reduce<Record<string | number, unknown>>(
                (current, key) => current[key] as Record<string | number, unknown>,
                payload as unknown as Record<string | number, unknown>
            );

            parent[targetKey] = file;
        }

        return { withMsgpack: true, args: payload };
    }

    return { withMsgpack: false, args: customArgs };
}

function isFile(file: unknown): file is File {
    return file instanceof File;
}