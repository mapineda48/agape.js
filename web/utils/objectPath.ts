/**
 * @fileoverview
 * Utilidades ligeras para manipular propiedades anidadas en objetos
 * usando rutas expresadas como arreglos (`(string | number)[]`).
 *
 * Estas funciones reemplazan a las de Lodash (`get`, `set`, `has`, `merge`, `pullAt`, `isEqual`)
 * con implementaciones nativas, seguras y tree-shakeables.
 *
 * Ventajas:
 * - Cero dependencias externas.
 * - Mayor compatibilidad con TypeScript.
 * - Mejor rendimiento y menor tamaño de bundle.
 * - Seguridad de referencia mediante `structuredClone`.
 */

/**
 * Obtiene un valor anidado dentro de un objeto dado un arreglo de claves (`path`).
 *
 * @example
 * get({ user: { name: "Miguel" } }, ["user", "name"]) // "Miguel"
 * get({ user: {} }, ["user", "age"], 30) // 30
 *
 * @param obj Objeto base del cual se obtendrá el valor.
 * @param path Arreglo de claves o índices que representan la ruta.
 * @param defaultValue Valor por defecto si la ruta no existe.
 * @returns El valor encontrado o el valor por defecto.
 */
function get(obj: any, path: (string | number)[], defaultValue?: any): any {
  return path.reduce(
    (acc, key) => (acc?.[key] !== undefined ? acc[key] : defaultValue),
    obj
  );
}

/**
 * Asigna un valor a una propiedad anidada dentro de un objeto.
 * Crea objetos o arreglos intermedios según corresponda.
 *
 * @example
 * const obj = {};
 * set(obj, ["user", "name"], "Miguel");
 * console.log(obj); // { user: { name: "Miguel" } }
 *
 * @param obj Objeto destino.
 * @param path Ruta de claves o índices donde asignar el valor.
 * @param value Valor a asignar.
 * @returns El objeto modificado.
 */
function set(obj: any, path: (string | number)[], value: any): any {
  let curr = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (curr[key] === undefined)
      curr[key] = typeof path[i + 1] === "number" ? [] : {};
    curr = curr[key];
  }
  curr[path[path.length - 1]] = value;
  return obj;
}

/**
 * Verifica si una ruta (`path`) existe dentro de un objeto.
 *
 * @example
 * has({ user: { name: "Miguel" } }, ["user", "name"]) // true
 * has({ user: {} }, ["user", "age"]) // false
 *
 * @param obj Objeto base.
 * @param path Ruta de claves o índices.
 * @returns `true` si la ruta existe y su valor no es `undefined`.
 */
function has(obj: any, path: (string | number)[]): boolean {
  return (
    path.reduce(
      (acc, key) => (acc && key in acc ? acc[key] : undefined),
      obj
    ) !== undefined
  );
}

/**
 * Fusiona recursivamente las propiedades de `source` dentro de `target`.
 * No muta el objeto fuente. Las propiedades de tipo objeto se combinan,
 * mientras que los valores primitivos y arreglos se clonan por valor.
 *
 * @example
 * merge({ user: { name: "M" } }, { user: { age: 25 } })
 * // => { user: { name: "M", age: 25 } }
 *
 * @param target Objeto destino (será mutado).
 * @param source Objeto fuente cuyos valores serán copiados.
 * @returns El objeto destino fusionado.
 */
function merge(target: any, source: any): any {
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {};
      merge(target[key], source[key]);
    } else {
      target[key] = structuredClone(source[key]);
    }
  }
  return target;
}

/**
 * Elimina uno o varios elementos de un arreglo en los índices especificados.
 * Modifica el arreglo original y devuelve una referencia al mismo.
 *
 * @example
 * const arr = ["a", "b", "c", "d"];
 * pullAt(arr, [1, 3]); // ["a", "c"]
 *
 * @param arr Arreglo a modificar.
 * @param indices Índices a eliminar.
 * @returns El mismo arreglo después de eliminar los elementos.
 */
function pullAt<T>(arr: T[], indices: number[]): T[] {
  indices.sort((a, b) => b - a).forEach((i) => arr.splice(i, 1));
  return arr;
}

/**
 * Compara profundamente dos valores mediante su representación JSON.
 * Adecuado para estructuras pequeñas o medianas (no circulares).
 *
 * ⚠️ Nota: No soporta objetos con referencias circulares.
 * Para estructuras grandes o de alto rendimiento, usar una comparación más eficiente.
 *
 * @example
 * isEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }) // true
 *
 * @param a Primer valor a comparar.
 * @param b Segundo valor a comparar.
 * @returns `true` si ambos valores son equivalentes.
 */
function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export { get, set, has, merge, pullAt, isEqual };
