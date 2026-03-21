/**
 * Field Components
 *
 * Exports for Form.Field, Form.Label, Form.Error, and Form.Description.
 *
 * @module Field
 */

// Components
export { Field, type FieldProps } from "./Field";
export { Label, type LabelProps } from "./Label";
export { Error, type ErrorProps } from "./Error";
export { Description, type DescriptionProps } from "./Description";

// Context (for advanced usage)
export {
  useFieldContext,
  useFieldContextOptional,
  useFieldContextValue,
  type FieldContextValue,
} from "./context";

// Default export
export { Field as default } from "./Field";
