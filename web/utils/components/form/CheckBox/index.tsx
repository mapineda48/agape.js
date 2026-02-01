import { useMemo, forwardRef, type JSX } from "react";
import useInput from "../Input/useInput";
import stringToPath from "#web/utils/stringToPath";
import { useFieldContextOptional } from "../Field/context";

/**
 * Props for the Checkbox component.
 */
export interface CheckboxProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store */
  path?: string | number;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
  /** If true, validates the field when the value changes */
  validateOnChange?: boolean;
  /** If true, validates the field when it loses focus (default: true) */
  validateOnBlur?: boolean;
}

/**
 * Checkbox input connected to the form store.
 * Stores boolean values.
 * Integrates with Form.Field for automatic validation.
 *
 * @example
 * ```tsx
 * // Standalone usage
 * <Form.Checkbox path="isActive" />
 *
 * // Inside Form.Field
 * <Form.Field name="agreeToTerms" required>
 *   <Form.Checkbox />
 *   <Form.Label>I agree to the terms</Form.Label>
 *   <Form.Error />
 * </Form.Field>
 * ```
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>((props, ref) => {
  const {
    path: pathProp,
    defaultChecked = false,
    materialize,
    autoCleanup,
    validateOnChange,
    validateOnBlur = true,
    ...core
  } = props;

  // Get path from Field context if not provided
  const fieldContext = useFieldContextOptional();
  const path = pathProp ?? fieldContext?.name ?? "";

  const paths = useMemo(() => stringToPath(path), [path]);

  const { value, onChange, onBlur } = useInput<boolean>(paths, defaultChecked, {
    materialize,
    autoCleanup,
    validateOnChange,
    validateOnBlur,
  });

  // Get accessibility attributes from field context
  const inputId = fieldContext?.inputId;
  const ariaDescribedBy = [
    fieldContext?.descriptionId,
    fieldContext?.errorId,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <input
      {...core}
      ref={ref}
      id={inputId}
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.currentTarget.checked)}
      onBlur={(e) => {
        onBlur();
        core.onBlur?.(e);
      }}
      aria-describedby={ariaDescribedBy}
      aria-invalid={fieldContext?.errorId ? true : undefined}
    />
  );
});

Checkbox.displayName = "Form.Checkbox";

export default Checkbox;
