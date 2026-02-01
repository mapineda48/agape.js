/**
 * Types Module
 *
 * Exports type utilities for the form system.
 *
 * @module types
 */

export {
  // Path types
  type Path,
  type PathValue,
  type FieldPath,
  type StringPath,
  type NumberPath,
  type BooleanPath,
  type ArrayPath,
  type ArrayElementPath,
  type ArrayFieldPath,
  // Props types
  type TypedFieldProps,
  type TypedInputProps,
  // Schema types
  type InferSchema,
  type SchemaPath,
  type SchemaPathValue,
  // Utility functions
  buildPath,
  joinPath,
  splitPath,
  appendIndex,
  getParentPath,
  getFieldName,
  isArrayIndexPath,
  isArrayElementPath,
} from "./paths";
