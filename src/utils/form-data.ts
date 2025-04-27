
import DateTime from "./DateTime";
import Decimal from "./Decimal";

export const FormKey = "";

/**
 * Convierte argumentos de JavaScript a FormData para envío HTTP,
 * extrayendo fechas y ficheros.
 */
export function toFormData(args: unknown[]): FormData {
    // Deep copy para no mutar el original
    // Extraer fechas y ficheros
    const [payload, dates, decimals, files] = toResponse({ payload: structuredClone(args) })

    const formData = new FormData();

    formData.append(FormKey, JSON.stringify(payload));
    formData.append(FormKey, JSON.stringify(dates));
    formData.append(FormKey, JSON.stringify(decimals));

    files.forEach(([name, file]) => formData.append(JSON.stringify(name), file));

    return formData;
}

export function fromResponse([payload, dates, decimals]: [unknown, [Path, string][], [Path, string][]]) {

    dates.forEach(([path, date]) => setPaths(payload, path, new DateTime(date)));
    decimals.forEach(([path, decimal]) => setPaths(payload, path, new Decimal(decimal)));

    return payload;
}

/**
 * Asigna un valor a un objeto siguiendo un path de claves.
 *
 * @param source Objeto base donde asignar.
 * @param paths Array de claves para llegar a la propiedad.
 * @param value Valor a asignar.
 */
export function setPaths(source: any, target: Paths | string, value: unknown): void {
    const paths: Paths = Array.isArray(target) ? target : JSON.parse(target);

    const path = paths[paths.length - 1];

    const obj = paths.slice(0, -1).reduce((acc, key) => acc[key], source);

    obj[path] = value;
}

export function toResponse({ payload, paths = [], dates = [], decimals = [], files = [] }: INewResponse) {
    if (payload == null || typeof payload !== "object") {
        return [payload, [], [], []] as IResponse;
    }

    for (const [key, value] of Object.entries(payload)) {
        const segment = Array.isArray(payload) ? Number(key) : key;
        const currentPath: Path = [...paths, segment];

        if (isPlainObject(value) || Array.isArray(value)) {
            toResponse({
                payload: value,
                paths: currentPath,
                dates,
                decimals,
                files
            });
        }

        if (value instanceof DateTime) {
            dates.push([currentPath, value]);
            unset(payload, segment);

            continue;
        }

        if (value instanceof Decimal) {
            decimals.push([currentPath, value]);
            unset(payload, segment);

            continue;
        }

        if (value instanceof File) {
            files.push([currentPath, value]);
            unset(payload, segment);

            continue;
        }
    }

    return [payload, dates, decimals, files] as IResponse
}

function unset(payload: object, segment: string | number) {
    if (Array.isArray(payload)) {
        (payload as unknown[])[segment as number] = null;
    } else {
        delete (payload as Record<string, unknown>)[segment as string];
    }
}

/**
 * Recorre recursivamente un objeto o arreglo y extrae instancias
 * de un tipo dado, devolviendo su ruta y el valor.
 *
 * @param payload    Objeto o arreglo a procesar.
 * @param instanceType Constructor del tipo a buscar.
 * @param basePath   Ruta acumulada (interna).
 * @returns Lista de pares [ruta, instancia].
 */
export function extractInstances<T>(payload: unknown, instanceType: new (...args: any[]) => T, basePath: Path = []): Array<[Path, T]> {
    if (payload == null || typeof payload !== "object") {
        return [];
    }

    return Object.entries(payload).flatMap(([key, value]) => {
        const segment = Array.isArray(payload) ? Number(key) : key;
        const currentPath: Path = [...basePath, segment];

        if (isPlainObject(value) || Array.isArray(value)) {
            return extractInstances<T>(value, instanceType, currentPath);
        }

        if (!(value instanceof instanceType)) {
            return [];
        }

        // “Eliminar” el valor extraído del payload
        if (Array.isArray(payload)) {
            (payload as unknown[])[segment as number] = null;
        } else {
            delete (payload as Record<string, unknown>)[segment as string];
        }

        return [[currentPath, value as T]];
    });
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

/** Representa una ruta en el objeto (índices o claves). */
type Path = Array<string | number>;

type PathSegment = string | number;
type Paths = PathSegment[];

interface INewResponse {
    payload: unknown,
    paths?: Path,
    dates?: Array<[Path, DateTime]>,
    decimals?: Array<[Path, Decimal]>,
    files?: Array<[Path, File]>
}

type IResponse = [unknown, [Path, DateTime][], [Path, Decimal][], [Path, File][]];