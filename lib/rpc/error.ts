export default function parseError(error: unknown): Error {
    console.error(error);

    if (error instanceof Error) {
        return error;
    }

    return new Error("Ups... Something wrong!")
}