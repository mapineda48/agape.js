/**
 * Type-Safe Paths
 *
 * Provides TypeScript utilities for type-safe path access in forms.
 * Enables autocompletion and compile-time validation of field paths.
 *
 * @module types/paths
 */

// ============================================================================
// Path Type Utilities
// ============================================================================

/**
 * Primitive types that cannot be traversed further.
 */
type Primitive = string | number | boolean | bigint | symbol | undefined | null;

/**
 * Types that should be treated as leaf nodes (not traversable).
 */
type LeafType = Primitive | Date | File | Blob | ((...args: unknown[]) => unknown);

/**
 * Get array element type.
 */
type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;

// ============================================================================
// Path Generation
// ============================================================================

/**
 * Generates all valid dot-notation paths for a given type.
 *
 * @example
 * ```ts
 * type User = { name: string; address: { city: string } };
 * type UserPaths = Path<User>;
 * // = "name" | "address" | "address.city"
 * ```
 */
export type Path<T, Depth extends number = 10> = Depth extends 0
  ? never
  : T extends LeafType
    ? never
    : T extends readonly (infer E)[]
      ? `${number}` | `${number}.${Path<E, Prev[Depth]>}`
      : T extends object
        ? {
            [K in keyof T & string]: T[K] extends LeafType
              ? K
              : T[K] extends readonly unknown[]
                ? K | `${K}.${number}` | `${K}.${number}.${Path<ArrayElement<T[K]>, Prev[Depth]>}`
                : K | `${K}.${Path<T[K], Prev[Depth]>}`;
          }[keyof T & string]
        : never;

/**
 * Depth counter for recursive types (prevents infinite recursion).
 */
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// ============================================================================
// Path Value Extraction
// ============================================================================

/**
 * Extracts the value type at a given path.
 *
 * @example
 * ```ts
 * type User = { name: string; address: { city: string } };
 * type CityType = PathValue<User, "address.city">;
 * // = string
 * ```
 */
export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : K extends `${number}`
      ? T extends readonly (infer E)[]
        ? PathValue<E, Rest>
        : never
      : never
  : P extends keyof T
    ? T[P]
    : P extends `${number}`
      ? T extends readonly (infer E)[]
        ? E
        : never
      : never;

// ============================================================================
// Field Path with Type Inference
// ============================================================================

/**
 * A path that points to a specific value type.
 *
 * @example
 * ```ts
 * type User = { name: string; age: number };
 * type StringPaths = FieldPath<User, string>;
 * // = "name"
 * ```
 */
export type FieldPath<T, V> = {
  [P in Path<T>]: PathValue<T, P> extends V ? P : never;
}[Path<T>];

/**
 * Path to a string field.
 */
export type StringPath<T> = FieldPath<T, string>;

/**
 * Path to a number field.
 */
export type NumberPath<T> = FieldPath<T, number>;

/**
 * Path to a boolean field.
 */
export type BooleanPath<T> = FieldPath<T, boolean>;

/**
 * Path to an array field.
 */
export type ArrayPath<T> = {
  [P in Path<T>]: PathValue<T, P> extends readonly unknown[] ? P : never;
}[Path<T>];

// ============================================================================
// Utility Types for Components
// ============================================================================

/**
 * Props for a typed field component.
 */
export interface TypedFieldProps<T, P extends Path<T> = Path<T>> {
  /**
   * Path to the field in the form state.
   * Provides autocompletion and type-checking.
   */
  path: P;
}

/**
 * Props for a typed input that expects a specific value type.
 */
export interface TypedInputProps<T, V, P extends FieldPath<T, V> = FieldPath<T, V>> {
  /**
   * Path to a field that contains the expected value type.
   */
  path: P;
}

// ============================================================================
// Schema Type Extraction (for Zod integration)
// ============================================================================

/**
 * Extracts the inferred type from a Zod schema.
 * Works with z.ZodType and its subclasses.
 */
export type InferSchema<S> = S extends { _output: infer O } ? O : never;

/**
 * Gets the Path type for a Zod schema.
 */
export type SchemaPath<S> = Path<InferSchema<S>>;

/**
 * Gets the PathValue for a Zod schema.
 */
export type SchemaPathValue<S, P extends string> = PathValue<InferSchema<S>, P>;

// ============================================================================
// Array Index Paths
// ============================================================================

/**
 * Creates a path to an array element.
 *
 * @example
 * ```ts
 * type Users = { users: { name: string }[] };
 * type UserPath = ArrayElementPath<Users, "users">;
 * // = "users.0" | "users.1" | ... (conceptually)
 * // At runtime: `users.${number}`
 * ```
 */
export type ArrayElementPath<T, P extends ArrayPath<T>> = `${P}.${number}`;

/**
 * Creates a path to a field within an array element.
 */
export type ArrayFieldPath<T, P extends ArrayPath<T>, F extends string> = `${P}.${number}.${F}`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type-safe path builder.
 * Creates a properly typed path string.
 *
 * @example
 * ```ts
 * const path = buildPath<User>()("address", "city");
 * // path: "address.city" with proper typing
 * ```
 */
export function buildPath<T>() {
  return <P extends Path<T>>(path: P): P => path;
}

/**
 * Joins path segments into a dot-notation string.
 */
export function joinPath(...segments: (string | number)[]): string {
  return segments.join(".");
}

/**
 * Splits a path string into segments.
 */
export function splitPath(path: string): string[] {
  return path.split(".");
}

/**
 * Appends an index to an array path.
 */
export function appendIndex(path: string, index: number): string {
  return `${path}.${index}`;
}

/**
 * Gets the parent path from a path string.
 *
 * @example
 * ```ts
 * getParentPath("user.address.city") // "user.address"
 * getParentPath("user") // ""
 * ```
 */
export function getParentPath(path: string): string {
  const segments = splitPath(path);
  segments.pop();
  return segments.join(".");
}

/**
 * Gets the last segment of a path.
 *
 * @example
 * ```ts
 * getFieldName("user.address.city") // "city"
 * ```
 */
export function getFieldName(path: string): string {
  const segments = splitPath(path);
  return segments[segments.length - 1] || "";
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Checks if a path is an array index path.
 */
export function isArrayIndexPath(path: string): boolean {
  const segments = splitPath(path);
  return segments.some((seg) => /^\d+$/.test(seg));
}

/**
 * Checks if the last segment is a number (array element access).
 */
export function isArrayElementPath(path: string): boolean {
  const fieldName = getFieldName(path);
  return /^\d+$/.test(fieldName);
}
