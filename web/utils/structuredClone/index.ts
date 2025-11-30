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
 * -----------------------------------------------------------------------------
 *  Contexto / Diseño
 * -----------------------------------------------------------------------------
 *
 * Problema:
 *  - `structuredClone` no sabe cómo clonar instancias personalizadas (por ejemplo
 *    `Decimal` o `DateTime`), lo que rompe cuando queremos usarlo para clonar
 *    el estados complejos.
 *
 * Solución:
 *  - Antes de clonar, transformamos los tipos especiales a una representación
 *    100% serializable (objetos planos con una "marca" y un string).
 *  - Usamos `structuredClone` sobre esa versión segura.
 *  - Después del clone, recorremos la estructura y reconstruimos las instancias
 *    originales (`Decimal`, `DateTime`) a partir de los marcadores.
 *
 * Flujo:
 *  1. `applyHelpersToSerialized`:
 *     - Recorrido recursivo del valor original.
 *     - Sustituye `Decimal` / `DateTime` por objetos marcados.
 *     - NO muta el valor original.
 *
 *  2. `structuredClone`:
 *     - Hace el clon profundo nativo sobre la estructura ya "sanitizada".
 *
 *  3. `removeHelpersFromSerialized`:
 *     - Recorrido recursivo del clon.
 *     - Detecta los marcadores y reinstancia `Decimal` / `DateTime`.
 *     - Devuelve un nuevo grafo, independiente del original.
 *
 * Consideraciones de rendimiento:
 *  - Este enfoque implica 3 recorridos completos del grafo:
 *      a) prepare (`applyHelpersToSerialized`)
 *      b) structuredClone
 *      c) restore (`removeHelpersFromSerialized`)
 *  - Es perfectamente razonable para estructuras de tamaño medio
 *    (p.ej. estado de formularios).
 *  - No está pensado para clonar:
 *      - árboles de datos gigantes (logs masivos, dumps, etc.),
 *      - ni estructuras extremadamente profundas.
 *
 * Limitaciones / Contrato:
 *  - Asume estructuras **acíclicas** (sin referencias circulares).
 *    - Si hay ciclos, la recursividad de `applyHelpersToSerialized` /
 *      `removeHelpersFromSerialized` terminará en stack overflow
 *      ANTES de que `structuredClone` pueda intervenir.
 *  - Sólo procesa:
 *      - Arrays
 *      - Objetos planos (`{}` con prototipo Object.prototype o null)
 *  - No manipula contenedores especiales como:
 *      - `Map`, `Set`, etc.
 *    Si metemos un `Decimal` dentro de un `Map`, no será convertido a marcador
 *    y `structuredClone` seguirá sin saber clonarlo.
 *
 * Inmutabilidad / pureza:
 *  - Ninguna de las funciones muta el objeto de entrada; siempre construyen
 *    nuevas estructuras (arrays/objetos nuevos).
 *  - Los `Decimal` / `DateTime` devueltos son nuevas instancias.
 *  - Para tipos que no tocamos (números, strings, etc.), se devuelve la
 *    referencia original, pero jamás se modifica dentro de estas funciones.
 *
 * Uso recomendado:
 *  - Usar `cloneWithHelpers` donde normalmente usarías `structuredClone`, pero
 *    sabiendo que pueden aparecer instancias de `Decimal` o `DateTime`.
 *  - Es una pieza de infraestructura: si se añaden nuevos tipos especiales en
 *    el futuro (p.ej. `Money`, `UUID`), este es el lugar donde extender el
 *    comportamiento.
 */

/**
 * Recorre un valor y transforma instancias de tipos especiales
 * (`Decimal`, `DateTime`) en objetos planos marcados y serializables.
 *
 * Ejemplos:
 *  - Decimal("1.23") => { "__decimal.js__": "1.23" }
 *  - DateTime(...)   => { "__datetime.js__": "<ISO string>" }
 *
 * No muta el valor original: siempre crea nuevos arrays/objetos cuando recorre
 * la estructura. Para valores "simples" (number, string, etc.) devuelve el
 * mismo valor.
 */
export function applyHelpersToSerialized(value: any): any {
  if (value instanceof Decimal) {
    // Representación serializable de Decimal
    return { [DECIMAL_MARK]: value.toString() };
  }

  if (value instanceof DateTime) {
    // Representación serializable de DateTime
    return { [DATETIME_MARK]: value.toJSON() };
  }

  if (Array.isArray(value)) {
    // Creamos un nuevo array, no mutamos el existente
    return value.map(applyHelpersToSerialized);
  }

  if (isPlainObject(value)) {
    // Creamos un nuevo objeto plano y copiamos propiedad por propiedad
    const result: any = {};
    for (const key of Object.keys(value)) {
      result[key] = applyHelpersToSerialized(value[key]);
    }
    return result;
  }

  // Otros tipos (number, string, boolean, null, undefined, etc.)
  // se devuelven tal cual; no se modifican ni se clonan aquí.
  return value;
}

/**
 * Recorre un valor (ya clonado) y reemplaza los objetos marcados por
 * instancias reales de `Decimal` o `DateTime`.
 *
 * Ejemplos:
 *  - { "__decimal.js__": "1.23" } => new Decimal("1.23")
 *  - { "__datetime.js__": "<ISO>" } => new DateTime("<ISO>")
 *
 * Al igual que `applyHelpersToSerialized`, no muta el valor que recibe:
 * siempre construye nuevos arrays/objetos al recorrer la estructura.
 */
export function removeHelpersFromSerialized(value: any): any {
  if (isMark(value, DECIMAL_MARK)) {
    return new Decimal(value[DECIMAL_MARK]);
  }

  if (isMark(value, DATETIME_MARK)) {
    return new DateTime(value[DATETIME_MARK]);
  }

  if (Array.isArray(value)) {
    return value.map(removeHelpersFromSerialized);
  }

  if (isPlainObject(value)) {
    const result: any = {};
    for (const key of Object.keys(value)) {
      result[key] = removeHelpersFromSerialized(value[key]);
    }
    return result;
  }

  return value;
}

/**
 * Determina si un valor es un "objeto plano" (plain object).
 *
 * Definición que usamos aquí:
 *  - `typeof value === "object"`
 *  - no es null
 *  - su prototipo es exactamente `Object.prototype` o `null`
 *
 * Esto evita tocar instancias de clases, `Map`, `Set`, etc., que podrían
 * tener invariantes propios y no queremos modificar.
 */
function isPlainObject(value: any): value is Record<string, any> {
  if (!value || typeof value !== "object") return false;

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

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
 * Wrapper de `structuredClone` que añade soporte para tipos personalizados
 * (`Decimal`, `DateTime`) mediante una fase de "preparación" y otra de
 * "restauración".
 *
 * Pasos:
 *  1. `applyHelpersToSerialized(value)`:
 *     - Sustituye instancias de `Decimal` / `DateTime` por objetos marcados.
 *
 *  2. `structuredClone(prepared)`:
 *     - Hace un clon profundo, ahora seguro, porque sólo ve tipos nativos
 *       serializables (objetos planos, arrays, strings, etc.).
 *
 *  3. `removeHelpersFromSerialized(cloned)`:
 *     - Recorre el clon y reconstruye las instancias de `Decimal` / `DateTime`
 *       allí donde detecta los marcadores.
 *
 * Garantías:
 *  - El valor devuelto es un grafo independiente: no comparte referencias
 *    con el valor original.
 *  - El valor original no se modifica en ningún momento.
 *
 * Limitaciones:
 *  - Asume que `value` es acíclico.
 *  - No soporta por ahora `Decimal` / `DateTime` dentro de `Map`, `Set`, etc.
 *    (se podrían añadir casos específicos si se necesitan).
 */
export function cloneWithHelpers<T>(value: T): T {
  const prepared = applyHelpersToSerialized(value);
  const cloned = structuredClone(prepared);
  return removeHelpersFromSerialized(cloned);
}
