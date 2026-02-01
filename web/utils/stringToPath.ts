/**
 * String to Path Utility
 *
 * Converts a dot-notation string path (e.g., "user.address.city")
 * into an array of path segments (e.g., ["user", "address", "city"]).
 *
 * @module #web/utils/stringToPath
 */

/**
 * Path input type - can be a string, number, or array of strings/numbers.
 */
export type PathInput = string | number | (string | number)[];

/**
 * Converts a path input to an array of string path segments.
 *
 * Supports:
 * - Simple dot notation: "user.name" -> ["user", "name"]
 * - Array indices: "users.0.name" -> ["users", "0", "name"]
 * - Bracket notation: "users[0].name" -> ["users", "0", "name"]
 * - Mixed notation: "data.users[0].profile.name" -> ["data", "users", "0", "profile", "name"]
 * - Number input: 0 -> ["0"]
 * - Array input: ["users", 0, "name"] -> ["users", "0", "name"]
 *
 * @param path - A path input (string, number, or array)
 * @returns An array of string path segments
 *
 * @example
 * ```ts
 * stringToPath("user.name");           // ["user", "name"]
 * stringToPath("users.0.email");       // ["users", "0", "email"]
 * stringToPath("users[0].email");      // ["users", "0", "email"]
 * stringToPath(0);                     // ["0"]
 * stringToPath(["users", 0, "name"]);  // ["users", "0", "name"]
 * ```
 */
export function stringToPath(path: PathInput): string[] {
  // Handle undefined/null
  if (path == null) {
    return [];
  }

  // Handle number
  if (typeof path === "number") {
    return [String(path)];
  }

  // Handle array
  if (Array.isArray(path)) {
    return path.map(String);
  }

  // Handle string
  if (!path) {
    return [];
  }

  // Replace bracket notation with dot notation
  // "users[0]" -> "users.0"
  const normalized = path.replace(/\[(\d+)\]/g, ".$1");

  // Split by dots and filter out empty strings
  return normalized.split(".").filter(Boolean);
}

export default stringToPath;
