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
import DatePicker from "./Input/DatePicker";

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
   * Root container for the form. Provides isolated Redux store and event context.
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
  DatePicker,

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
};

// Export Form as default for convenience
export default Form;

// ============ Type Exports ============
export type { Path } from "./store/dictSlice";
export type { FormOptions, UseFormReturn } from "./useForm";
export type { RootProps } from "./Root";
export type { ScopeProps } from "./Scope";
export type { IFieldArray } from "./useFieldArray";
export type { UseInputOptions } from "./Input/useInput";
export type { Props as SubmitProps } from "./Submit";

// Input Props Types
export type { TextProps } from "./Input/Text";
export type { IntProps } from "./Input/Int";
export type { FloatProps } from "./Input/Float";
export type { DecimalProps } from "./Input/Decimal";
export type { DateTimeProps } from "./Input/DateTime";
export type { DatePickerProps } from "./Input/DatePicker";
export type { TextAreaProps } from "./Input/TextArea";
export type { FileProps } from "./Input/File";
export type { CheckboxProps } from "./CheckBox";

// Select Props Types
export type { BooleanProps as SelectBooleanProps } from "./Select/Boolean";
export type { StringProps as SelectStringProps } from "./Select/String";
export type { IntProps as SelectIntProps } from "./Select/Int";

// ============ Internal Exports (for advanced usage) ============
// Store utilities - use with caution
export { useAppDispatch } from "./store/hooks";
export { setAtPath, resetState } from "./store/dictSlice";
