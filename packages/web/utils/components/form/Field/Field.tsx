/**
 * Form.Field Component
 *
 * A wrapper component that provides field-level context for its children.
 * Enables automatic association between Form.Label, Form.Error, Form.Description,
 * and the input component for accessibility.
 *
 * @module Field/Field
 */

import { type ReactNode } from "react";
import {
  FieldContextProvider,
  useFieldContextValue,
  type FieldContextValue,
} from "./context";
import PathProvider from "../paths";

// ============================================================================
// Types
// ============================================================================

export interface FieldProps {
  /**
   * The name/path of the field in the form state.
   * This is used for validation, error display, and path context.
   *
   * @example "email", "user.name", "addresses.0.street"
   */
  name: string;

  /**
   * Whether the field is required.
   * This affects aria-required and can be used for styling.
   */
  required?: boolean;

  /**
   * Whether the field is disabled.
   * This is passed to child inputs through context.
   */
  disabled?: boolean;

  /**
   * Child components (inputs, labels, errors, descriptions).
   */
  children: ReactNode;

  /**
   * Optional className for the wrapper element.
   */
  className?: string;

  /**
   * Render as a different element (default: div).
   */
  as?: "div" | "fieldset" | "span";
}

/**
 * Render props interface for Form.Field when using children as function.
 */
export interface FieldRenderProps extends FieldContextValue {
  /**
   * Whether the field has an error.
   */
  hasError: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Form.Field - Field wrapper component
 *
 * Provides context for child components (Label, Error, Description)
 * to automatically associate with the field for accessibility.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Form.Field name="email">
 *   <Form.Label>Email</Form.Label>
 *   <Form.Text />
 *   <Form.Error />
 * </Form.Field>
 *
 * // With required and disabled
 * <Form.Field name="email" required disabled>
 *   <Form.Label>Email</Form.Label>
 *   <Form.Text />
 * </Form.Field>
 *
 * // As fieldset for groups
 * <Form.Field name="address" as="fieldset">
 *   <Form.Label>Address</Form.Label>
 *   <Form.Text path="street" />
 *   <Form.Text path="city" />
 * </Form.Field>
 * ```
 */
export function Field({
  name,
  required,
  disabled,
  children,
  className,
  as: Component = "div",
}: FieldProps) {
  // Create field context with stable IDs
  const fieldContext = useFieldContextValue({
    name,
    required,
    disabled,
  });

  return (
    <FieldContextProvider value={fieldContext}>
      <PathProvider value={name}>
        <Component className={className} data-field={name}>
          {children}
        </Component>
      </PathProvider>
    </FieldContextProvider>
  );
}

Field.displayName = "Form.Field";

export default Field;
