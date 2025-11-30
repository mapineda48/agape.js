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

  if (isPlainObject(value)) {
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

  if (isPlainObject(value)) {
    const result: any = {};
    for (const key of Object.keys(value)) {
      result[key] = removeHelpersFromSerialized(value[key]);
    }
    return result;
  }

  return value;
}

function isPlainObject(value: any): value is Record<string, any> {
  if (!value || typeof value !== "object") return false;

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * 👇 Wrapper de structuredClone
 */
export function cloneWithHelpers<T>(value: T): T {
  const prepared = applyHelpersToSerialized(value);
  const cloned = structuredClone(prepared);
  return removeHelpersFromSerialized(cloned);
}
