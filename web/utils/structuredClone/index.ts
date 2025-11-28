import { markDecimals, reviveDecimals } from "./Decimal";

export function applyHelpersToSerialized<T>(value: T) {
  const prepared = markDecimals(value);
  return prepared;
}

export function removeHelpersFromSerialized<T>(value: T) {
  const prepared = reviveDecimals(value);
  return prepared;
}

/**
 * 👇 Wrapper de structuredClone
 */
export function cloneWithHelpers<T>(value: T): T {
  const prepared = applyHelpersToSerialized(value);
  const cloned = structuredClone(prepared);
  return removeHelpersFromSerialized(cloned);
}
