import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";
import isCustom from "./isCustom";

const DECIMAL_MARK = "__decimal.js__";
const DATETIME_MARK = "__datetime.js__";

export function applyHelpersToSerialized(value: any): any {
  if (value instanceof Decimal) {
    return { [DECIMAL_MARK]: value.toString() };
  }

  if (value instanceof DateTime) {
    return { [DATETIME_MARK]: value.toJSON() };
  }

  if (Array.isArray(value)) {
    return value.map(applyHelpersToSerialized);
  }

  if (value && typeof value === "object") {
    // Check if it's a plain object or something we should traverse
    // If it's a class instance that wasn't marked (e.g. unknown class), we might destroy it if we clone it.
    // But for Redux serialization, we generally want to serialize everything.
    // However, if we encounter an object that we don't know how to mark, we should probably leave it as is if it's not a plain object?
    // But standard Redux behavior is to warn. Here we just traverse.

    // Optimization: if constructor is not Object, maybe we shouldn't traverse?
    // But we need to traverse plain objects.

    const result: any = {};
    for (const key of Object.keys(value)) {
      result[key] = applyHelpersToSerialized(value[key]);
    }
    return result;
  }

  return value;
}

export function removeHelpersFromSerialized(value: any): any {
  if (isCustom(value, DECIMAL_MARK)) {
    return new Decimal(value[DECIMAL_MARK]);
  }

  if (isCustom(value, DATETIME_MARK)) {
    return new DateTime(value[DATETIME_MARK]);
  }

  if (Array.isArray(value)) {
    return value.map(removeHelpersFromSerialized);
  }

  if (value && typeof value === "object") {
    const result: any = {};
    for (const key of Object.keys(value)) {
      result[key] = removeHelpersFromSerialized(value[key]);
    }
    return result;
  }

  return value;
}

/**
 * 👇 Wrapper de structuredClone
 */
export function cloneWithHelpers<T>(value: T): T {
  const prepared = applyHelpersToSerialized(value);
  const cloned = structuredClone(prepared);
  return removeHelpersFromSerialized(cloned);
}
