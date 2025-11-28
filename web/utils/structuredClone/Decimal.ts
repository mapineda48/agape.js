import Decimal from "@utils/data/Decimal";

const DECIMAL_MARK = "__decimal.js__";

export function markDecimals(value: unknown): unknown {
  if (value instanceof Decimal) {
    // Representación serializable
    return { [DECIMAL_MARK]: value.toJSON() };
  }

  if (Array.isArray(value)) {
    return value.map(markDecimals);
  }

  if (value && typeof value === "object") {
    const result: any = {};
    for (const key of Object.keys(value)) {
      result[key] = markDecimals((value as any)[key]);
    }
    return result;
  }

  return value;
}

export function reviveDecimals(value: any): any {
  if (Array.isArray(value)) {
    return value.map(reviveDecimals);
  }

  if (value && typeof value === "object") {
    // Si es un decimal “marcado”
    if (
      Object.prototype.hasOwnProperty.call(value, DECIMAL_MARK) &&
      typeof (value as any)[DECIMAL_MARK] === "string"
    ) {
      return new Decimal((value as any)[DECIMAL_MARK]);
    }

    const result: any = {};
    for (const key of Object.keys(value)) {
      result[key] = reviveDecimals((value as any)[key]);
    }
    return result;
  }

  return value;
}
