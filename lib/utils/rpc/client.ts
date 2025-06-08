import { decode, encode } from "../mspack";

// Determines the base URL depending on the environment (production or development)
const baseURL = process.env.NODE_ENV === "development" ? "http://localhost:3000/" : location.origin;
const credentials = process.env.NODE_ENV === "development" ? "include" : "same-origin";

export default function makeClientRpc(pathname: string) {
    const url = new URL(pathname, baseURL).toString();

    return async (...args: unknown[]) => {
        const body = encode(args);

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/msgpack'
            },
            body,
            credentials
        });

        const buffer = await res.arrayBuffer();

        return decode(new Uint8Array(buffer));
    }
}