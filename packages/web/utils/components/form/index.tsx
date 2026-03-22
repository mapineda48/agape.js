/* eslint-disable react-refresh/only-export-components */
// =============================================================================
// Form - Compound Components API
// =============================================================================
// This module exports a unified Form object following the Compound Components
// pattern for improved Developer Experience (DX) and discoverability.
//
// Usage:
//   import { Form } from "@/components/form";
//
//   <Form.Root state={{ name: "" }}>
//     <Form.Scope path="profile">
//       <Form.Text path="name" />
//       <Form.Int path="age" />
//     </Form.Scope>
//     <Form.Submit onSubmit={handleSubmit}>Save</Form.Submit>
//   </Form.Root>
// =============================================================================

// Containers
import Root from "./Root";
import Scope from "./Scope";

// Field components (new in Phase 3)
import { Field, Label, Error, Description } from "./Field";

// Array component (new in Phase 5)
import { FormArray } from "./Array";

// Inputs - Text family
import Text from "./Input/Text";
import TextArea from "./Input/TextArea";
import File from "./Input/File";

// Inputs - Numeric family
import Int from "./Input/Int";
import Float from "./Input/Float";
import Decimal from "./Input/Decimal";

// Inputs - Date/Time family
import DateTime from "./Input/DateTime";

// Inputs - Boolean/Selection
import Checkbox from "./CheckBox";
import SelectBoolean from "./Select/Boolean";
import SelectString from "./Select/String";
import SelectInt from "./Select/Int";

// Submit
import { Submit } from "./Submit";

// Hooks
import { useForm } from "./useForm";
import { useFormState } from "./useFormState";
import { useFieldArray, useSelector } from "./useFieldArray";
import useInput from "./Input/useInput";

// Validation hooks
import {
  useFieldError,
  useFieldTouched,
  useFieldDirty,
  useFieldState,
  useFieldValidation,
  useFormValidationState,
  useFormErrors,
  useFormIsValid,
  useFormIsValidating,
  useFormIsSubmitting,
  useValidationActions,
} from "./validation";

// Field context hooks (new in Phase 3)
import { useFieldContext, useFieldContextOptional } from "./Field";

/**
 * Form - Compound Components API
 *
 * A unified namespace for all form-related components and hooks.
 * Provides improved discoverability through IDE autocomplete.
 *
 * @example
 * ```tsx
 * import { Form } from "@/components/form";
 *
 * function UserForm() {
 *   return (
 *     <Form.Root state={{ user: { name: "", age: 0 } }}>
 *       <Form.Scope path="user">
 *         <Form.Text path="name" placeholder="Name" />
 *         <Form.Int path="age" placeholder="Age" />
 *       </Form.Scope>
 *       <Form.Submit onSubmit={handleSubmit}>
 *         Save User
 *       </Form.Submit>
 *     </Form.Root>
 *   );
 * }
 * ```
 */
export const Form = {
  // ============ Containers ============
  /**
   * Root container for the form. Provides isolated Zustand store, validation, and event context.
   */
  Root,

  /**
   * Creates a nested scope for form fields (semantic wrapper over PathProvider).
   */
  Scope,

  /**
   * Submit button with loading state management.
   */
  Submit,

  // ============ Field Components (New) ============
  /**
   * Field wrapper that provides context for Label, Error, Description.
   * Creates a scope for the field and enables accessibility features.
   */
  Field,

  /**
   * Accessible label component that auto-associates with the field input.
   */
  Label,

  /**
   * Error message component that displays validation errors.
   */
  Error,

  /**
   * Description/help text component for the field.
   */
  Description,

  // ============ Array Fields (New in Phase 5) ============
  /**
   * Declarative component for rendering dynamic arrays.
   * Uses render props for maximum flexibility.
   */
  Array: FormArray,

  // ============ Text Inputs ============
  /**
   * Text input field with support for text, email, and password types.
   */
  Text,

  /**
   * Multi-line text area.
   */
  TextArea,

  /**
   * File input for single or multiple files.
   */
  File,

  // ============ Numeric Inputs ============
  /**
   * Integer number input.
   */
  Int,

  /**
   * Floating point number input.
   */
  Float,

  /**
   * High-precision decimal input (uses Decimal.js).
   */
  Decimal,

  // ============ Date/Time Inputs ============
  /**
   * Date and time input.
   */
  DateTime,

  // ============ Boolean/Selection Inputs ============
  /**
   * Checkbox input for boolean values.
   */
  Checkbox,

  /**
   * Select components for various value types.
   */
  Select: {
    /**
     * Boolean select (Yes/No).
     */
    Boolean: SelectBoolean,
    /**
     * String value select.
     */
    String: SelectString,
    /**
     * Integer value select.
     */
    Int: SelectInt,
  },

  // ============ Hooks ============
  /**
   * Hook for form actions (reset, merge, setAt, getValues) without reactive state.
   * Use when you only need to perform actions, not subscribe to state changes.
   */
  useForm,

  /**
   * Hook for reactive form state subscription.
   * ⚠️ Causes re-renders on state changes. Use sparingly for performance.
   */
  useState: useFormState,

  /**
   * Hook for managing dynamic arrays in the form store.
   */
  useArray: useFieldArray,

  /**
   * Hook for selecting derived data from form state.
   */
  useSelector,

  /**
   * Low-level hook for binding an input to a path in the form store.
   */
  useInput,

  // ============ Validation Hooks ============
  /**
   * Hook to get the error message for a specific field.
   */
  useFieldError,

  /**
   * Hook to check if a field has been touched (focused and blurred).
   */
  useFieldTouched,

  /**
   * Hook to check if a field value has changed from initial.
   */
  useFieldDirty,

  /**
   * Hook to get all validation state for a field (error, touched, dirty).
   */
  useFieldState,

  /**
   * Hook with complete field validation functionality (state + actions).
   */
  useFieldValidation,

  /**
   * Hook to get the complete form validation state.
   */
  useFormValidationState,

  /**
   * Hook to get all form errors.
   */
  useFormErrors,

  /**
   * Hook to check if the form is valid.
   */
  useFormIsValid,

  /**
   * Hook to check if the form is currently validating.
   */
  useFormIsValidating,

  /**
   * Hook to check if the form is currently submitting.
   */
  useFormIsSubmitting,

  /**
   * Hook to get validation actions (setError, clearError, validateField, etc.).
   */
  useValidationActions,

  // ============ Field Context Hooks (New) ============
  /**
   * Hook to get the current field context (name, IDs for accessibility).
   * Must be used within a Form.Field.
   */
  useFieldContext,

  /**
   * Hook to safely get the field context (returns null if not in a Form.Field).
   */
  useFieldContextOptional,
};

// Export Form as default for convenience
export default Form;

// ============ Type Exports ============
export type { Path } from "./store/zustand";
export type { FormOptions, UseFormReturn } from "./useForm";
export type { RootProps } from "./Root";
export type { ScopeProps } from "./Scope";
export type { IFieldArray } from "./useFieldArray";
export type { UseInputOptions, UseInputReturn } from "./Input/useInput";
export type { Props as SubmitProps, SubmitFormState, SubmitRenderProp } from "./Submit";

// Field Props Types (new in Phase 3)
export type { FieldProps } from "./Field/Field";
export type { LabelProps } from "./Field/Label";
export type { ErrorProps } from "./Field/Error";
export type { DescriptionProps } from "./Field/Description";
export type { FieldContextValue } from "./Field/context";

// Input Props Types
export type { TextProps } from "./Input/Text";
export type { IntProps } from "./Input/Int";
export type { FloatProps } from "./Input/Float";
export type { DecimalProps } from "./Input/Decimal";
export type { DateTimeProps } from "./Input/DateTime";
export type { TextAreaProps } from "./Input/TextArea";
export type { FileProps } from "./Input/File";
export type { CheckboxProps } from "./CheckBox";

// Select Props Types
export type { BooleanProps as SelectBooleanProps } from "./Select/Boolean";
export type { StringProps as SelectStringProps } from "./Select/String";
export type { IntProps as SelectIntProps } from "./Select/Int";

// Array Props Types (new in Phase 5)
export type {
  ArrayProps,
  ArrayField,
  ArrayOperations,
  ArrayMeta,
  ArrayRenderProp,
} from "./Array";

// ============ Internal Exports (for advanced usage) ============
// Store utilities - use with caution
export { useAppDispatch } from "./store/hooks";
export { useFormActions } from "./store/zustand-provider";

// Validation types
export type {
  FieldPath,
  FieldError,
  FieldErrors,
  TouchedFields,
  DirtyFields,
  ValidationMode,
  ReValidateMode,
  ValidationState,
  ValidationOptions,
  FieldValidationResult,
  FormValidationResult,
} from "./validation";

// Type-safe path types (new in Phase 4)
export type {
  Path as TypeSafePath,
  PathValue,
  FieldPath as TypedFieldPath,
  StringPath,
  NumberPath,
  BooleanPath,
  ArrayPath,
  ArrayElementPath,
  ArrayFieldPath,
  TypedFieldProps,
  TypedInputProps,
  InferSchema,
  SchemaPath,
  SchemaPathValue,
} from "./types";

// Path utility functions (new in Phase 4)
export {
  buildPath,
  joinPath,
  splitPath,
  appendIndex,
  getParentPath,
  getFieldName,
  isArrayIndexPath,
  isArrayElementPath,
} from "./types";
