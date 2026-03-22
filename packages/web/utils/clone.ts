/**
 * Deep Clone Utility
 *
 * This module provides deep cloning capabilities.
 * For the form store, values pass through directly without cloning.
 *
 * @module #web/utils/clone
 */

/**
 * Deep clones a value, preserving File, Blob, and other special objects.
 *
 * @template T - The type of the value to clone
 * @param value - The value to deep clone
 * @returns A deep clone of the input value
 */
export function deepClone<T>(value: T): T {
  // Handle null/undefined
  if (value == null) {
    return value;
  }

  // Handle primitives
  if (typeof value !== "object") {
    return value;
  }

  // Preserve File and Blob - they are not clonable
  if (typeof File !== "undefined" && value instanceof File) {
    return value;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return value;
  }

  // Preserve Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }

  // Check for custom types with clone methods or special handling
  const proto = Object.getPrototypeOf(value);
  
  // Preserve instances of custom classes (Decimal, DateTime, etc.)
  // These are typically immutable and don't need deep cloning
  if (proto !== Object.prototype && proto !== null) {
    return value;
  }

  // Handle plain objects
  const result: Record<string, unknown> = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      result[key] = deepClone((value as Record<string, unknown>)[key]);
    }
  }

  return result as T;
}

/**
 * Pass-through function - values go directly to store without transformation.
 * @deprecated Use values directly
 */
export function deepCloneWithHelpersToSerialized<T>(value: T): T {
  return value;
}

/**
 * Pass-through function - values come directly from store without transformation.
 * @deprecated Use values directly
 */
export function deepCloneWithOutHelpers<T>(value: T): T {
  return value;
}

export default deepClone;
