/**
 * Deep Clone Utilities using msgpackr
 *
 * This module provides deep cloning capabilities using msgpackr for
 * serialization/deserialization. It properly handles custom types like
 * Decimal, DateTime, and File through the registered msgpackr extensions.
 *
 * @module #web/utils/clone
 */

import { encode, decode } from "#shared/msgpackr";

/**
 * Deep clones a value using msgpackr serialization.
 *
 * This function creates a complete deep copy of the input value,
 * properly handling:
 * - Primitive types (string, number, boolean, null, undefined)
 * - Plain objects and arrays
 * - Custom types registered in msgpackr (Decimal, DateTime, File, Error)
 *
 * @template T - The type of the value to clone
 * @param value - The value to deep clone
 * @returns A deep clone of the input value
 *
 * @example
 * ```ts
 * const original = { user: { name: 'John' }, price: new Decimal('19.99') };
 * const cloned = deepClone(original);
 * // cloned is a completely independent copy
 * ```
 */
export function deepClone<T>(value: T): T {
  const encoded = encode(value);
  return decode<T>(encoded);
}

/**
 * Alias for deepClone - used for serialization to Redux store.
 *
 * This function is used when setting values in the Redux store to ensure
 * that custom types (Decimal, DateTime, File) are properly serialized
 * and can be stored/retrieved correctly.
 *
 * @template T - The type of the value to serialize
 * @param value - The value to serialize
 * @returns A deep clone suitable for Redux store
 */
export function deepCloneWithHelpersToSerialized<T>(value: T): T {
  return deepClone(value);
}

/**
 * Alias for deepClone - used when reading values from Redux store.
 *
 * This function is used when retrieving values from the Redux store
 * to ensure that the returned value is a clean copy that won't
 * accidentally mutate the store state.
 *
 * @template T - The type of the value to clone
 * @param value - The value to clone
 * @returns A deep clone of the value
 */
export function deepCloneWithOutHelpers<T>(value: T): T {
  return deepClone(value);
}

export default deepClone;
