/**
 * Field Context
 *
 * Provides field-level context for Form.Field and its children
 * (Form.Label, Form.Error, Form.Description).
 *
 * This context allows child components to know which field they belong to,
 * enabling automatic association for accessibility and validation.
 *
 * @module Field/context
 */

import { createContext, useContext, useMemo, useId } from "react";

// ============================================================================
// Types
// ============================================================================

export interface FieldContextValue {
  /**
   * The name/path of the field (e.g., "email", "user.name").
   */
  name: string;

  /**
   * Unique ID for the input element (for label[htmlFor]).
   */
  inputId: string;

  /**
   * Unique ID for the error message element (for aria-describedby).
   */
  errorId: string;

  /**
   * Unique ID for the description element (for aria-describedby).
   */
  descriptionId: string;

  /**
   * Whether the field is required (derived from schema or prop).
   */
  required?: boolean;

  /**
   * Whether the field is disabled.
   */
  disabled?: boolean;
}

// ============================================================================
// Context
// ============================================================================

const FieldContext = createContext<FieldContextValue | null>(null);

// ============================================================================
// Provider Hook
// ============================================================================

export interface UseFieldContextOptions {
  name: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Creates a field context value with stable IDs.
 * Use this in Form.Field to create the context.
 */
export function useFieldContextValue(
  options: UseFieldContextOptions
): FieldContextValue {
  const { name, required, disabled } = options;
  const uniqueId = useId();

  return useMemo(
    () => ({
      name,
      inputId: `field-${uniqueId}-input`,
      errorId: `field-${uniqueId}-error`,
      descriptionId: `field-${uniqueId}-description`,
      required,
      disabled,
    }),
    [name, uniqueId, required, disabled]
  );
}

// ============================================================================
// Consumer Hooks
// ============================================================================

/**
 * Hook to get the current field context.
 *
 * @throws Error if used outside of a Form.Field
 */
export function useFieldContext(): FieldContextValue {
  const context = useContext(FieldContext);
  if (!context) {
    throw new Error(
      "useFieldContext must be used within a Form.Field component"
    );
  }
  return context;
}

/**
 * Hook to safely get the field context.
 * Returns null if not inside a Form.Field (useful for standalone usage).
 */
export function useFieldContextOptional(): FieldContextValue | null {
  return useContext(FieldContext);
}

// ============================================================================
// Provider Component
// ============================================================================

export const FieldContextProvider = FieldContext.Provider;

export default FieldContext;
