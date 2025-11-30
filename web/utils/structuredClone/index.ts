import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";

/**
 * Marcadores internos usados para serializar tipos especiales.
 *
 * IMPORTANTE:
 * - Estos nombres se eligen para que sea muy poco probable colisionar con claves "normales"
 *   de objetos del dominio.
 * - Si en algún momento se cambian, hay que actualizar también la lógica de
 *   `applyHelpersToSerialized` y `removeHelpersFromSerialized`.
 */
const DECIMAL_MARK = "__decimal.js__";
const DATETIME_MARK = "__datetime.js__";

/**
 * Type guard para verificar si un objeto tiene una marca concreta
 * usada por nuestra capa de serialización.
 *
 * Requisitos:
 *  - `value` es un objeto no nulo
 *  - tiene la propiedad igual a `mark`
 *  - el valor de esa propiedad es un string
 *
 * Esto permite a TypeScript refinar el tipo y asumir que:
 *  - si `isMark(value, "__decimal.js__")` es true,
 *    entonces `value` tiene la forma `{ "__decimal.js__": string }`.
 */
export default function isMark<K extends string>(
  value: unknown,
  mark: K
): value is { [P in K]: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, mark) &&
    typeof (value as any)[mark] === "string"
  );
}

/**
 * Realiza una clonación profunda y recursiva de objetos y arrays.
 * Es una función pura: no muta el input y siempre retorna una nueva estructura.
 * @param {any} input - El objeto o array a clonar.
 * @returns {any} Una copia profunda del input.
 */
export function deepCloneWithHelpersToSerialized(input: any): any {
  // 1. Manejar casos base (Tipos Primitivos o nulos)
  // Si no es un objeto (o es null), simplemente retorna el valor (no necesita clonación).
  if (typeof input !== "object" || input === null) {
    return input;
  }

  if (input instanceof Decimal) {
    return { [DECIMAL_MARK]: input.toString() };
  }

  if (input instanceof DateTime) {
    return { [DATETIME_MARK]: input.toJSON() };
  }

  // File and Blob are immutable and can be stored as-is
  if (typeof File !== "undefined" && input instanceof File) {
    return input;
  }

  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return input;
  }

  const proto = Object.getPrototypeOf(input);

  const isArray = Array.isArray(input);

  if (!isArray && proto !== Object.prototype && proto !== null) {
    return structuredClone(input);
  }

  // 2. Determinar si es un Array o un Objeto
  let copia: any = isArray ? [] : {};

  // 3. Recorrer la estructura de forma Recursiva
  // Se usa el bucle 'for...in' para iterar sobre las propiedades del objeto/array.
  for (const clave in input) {
    // Es buena práctica verificar hasOwnProperty para evitar propiedades heredadas
    if (Object.prototype.hasOwnProperty.call(input, clave)) {
      const valor = input[clave];

      // La clave aquí es la recursividad:
      // Llama a deepClone para el valor actual. Si el valor es un objeto/array,
      // deepClone se encargará de clonarlo. Si es un primitivo, lo retornará.
      copia[clave] = deepCloneWithHelpersToSerialized(valor);
    }
  }

  return copia;
}

export function deepCloneWithOutHelpers(input: any): any {
  // 1. Manejar casos base (Tipos Primitivos o nulos)
  // Si no es un objeto (o es null), simplemente retorna el valor (no necesita clonación).
  if (typeof input !== "object" || input === null) {
    return input;
  }

  if (isMark(input, DECIMAL_MARK)) {
    return new Decimal(input[DECIMAL_MARK]);
  }

  if (isMark(input, DATETIME_MARK)) {
    return new DateTime(input[DATETIME_MARK]);
  }

  // File and Blob are immutable and can be returned as-is
  if (typeof File !== "undefined" && input instanceof File) {
    return input;
  }

  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return input;
  }

  const proto = Object.getPrototypeOf(input);

  const isArray = Array.isArray(input);

  if (!isArray && proto !== Object.prototype && proto !== null) {
    return structuredClone(input);
  }

  // 2. Determinar si es un Array o un Objeto
  let copia: any = isArray ? [] : {};

  // 3. Recorrer la estructura de forma Recursiva
  // Se usa el bucle 'for...in' para iterar sobre las propiedades del objeto/array.
  for (const clave in input) {
    // Es buena práctica verificar hasOwnProperty para evitar propiedades heredadas
    if (Object.prototype.hasOwnProperty.call(input, clave)) {
      const valor = input[clave];

      // La clave aquí es la recursividad:
      // Llama a deepClone para el valor actual. Si el valor es un objeto/array,
      // deepClone se encargará de clonarlo. Si es un primitivo, lo retornará.
      copia[clave] = deepCloneWithOutHelpers(valor);
    }
  }

  return copia;
}

export function deepClone(input: any): any {
  // 1. Manejar casos base (Tipos Primitivos o nulos)
  // Si no es un objeto (o es null), simplemente retorna el valor (no necesita clonación).
  if (typeof input !== "object" || input === null) {
    return input;
  }

  if (input instanceof Decimal) {
    return new Decimal(input.toString());
  }

  if (input instanceof DateTime) {
    return new DateTime(input.toJSON());
  }

  // File and Blob are immutable and can be returned as-is
  if (typeof File !== "undefined" && input instanceof File) {
    return input;
  }

  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return input;
  }

  const proto = Object.getPrototypeOf(input);

  const isArray = Array.isArray(input);

  if (!isArray && proto !== Object.prototype && proto !== null) {
    return structuredClone(input);
  }

  // 2. Determinar si es un Array o un Objeto
  let copia: any = isArray ? [] : {};

  // 3. Recorrer la estructura de forma Recursiva
  // Se usa el bucle 'for...in' para iterar sobre las propiedades del objeto/array.
  for (const clave in input) {
    // Es buena práctica verificar hasOwnProperty para evitar propiedades heredadas
    if (Object.prototype.hasOwnProperty.call(input, clave)) {
      const valor = input[clave];

      // La clave aquí es la recursividad:
      // Llama a deepClone para el valor actual. Si el valor es un objeto/array,
      // deepClone se encargará de clonarlo. Si es un primitivo, lo retornará.
      copia[clave] = deepClone(valor);
    }
  }

  return copia;
}
