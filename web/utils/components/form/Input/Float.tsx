import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "#web/utils/stringToPath";
import { useFieldContextOptional } from "../Field/context";

/**
 * Props for the Float input component.
 */
export interface FloatProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store (e.g. "price" or "item.0.cost") */
  path?: string | number;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
  /** If true, empty input will set null instead of 0 */
  nullable?: boolean;
  /** If true, validates the field when the value changes */
  validateOnChange?: boolean;
  /** If true, validates the field when it loses focus (default: true) */
  validateOnBlur?: boolean;
}

/**
 * Floating point number input connected to the form store.
 * Parses input as float and stores the numeric value.
 * Integrates with Form.Field for automatic validation.
 *
 * @example
 * ```tsx
 * <Form.Float path="price" step="0.01" />
 * <Form.Float path="weight" nullable />
 * ```
 */
const Float = forwardRef<HTMLInputElement, FloatProps>((props, ref) => {
  const {
    path: pathProp,
    materialize,
    autoCleanup,
    nullable,
    validateOnChange,
    validateOnBlur = true,
    ...core
  } = props;

  // Get path from Field context if not provided
  const fieldContext = useFieldContextOptional();
  const path = pathProp ?? fieldContext?.name ?? "";

  const paths = useMemo(() => stringToPath(path), [path]);

  const defaultValue = nullable ? null : 0;
  const { value, onChange, onBlur } = useInput<number | null>(
    paths,
    defaultValue,
    {
      materialize,
      autoCleanup,
      validateOnChange,
      validateOnBlur,
    }
  );

  const displayValue =
    value === null || Number.isNaN(value as number) ? "" : (value as number);

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
      type="number"
      value={displayValue}
      onChange={({ currentTarget }) => {
        const raw = currentTarget.value;
        // Empty string means cleared
        if (raw === "") {
          onChange(nullable ? null : 0);
          return;
        }
        // Allow intermediate states like "-" or "." while typing
        const parsed = parseFloat(raw);
        // Only update store if we have a valid number
        if (!Number.isNaN(parsed)) {
          onChange(parsed);
        }
      }}
      onBlur={(e) => {
        onBlur();
        core.onBlur?.(e);
      }}
      aria-describedby={ariaDescribedBy}
      aria-invalid={fieldContext?.errorId ? true : undefined}
    />
  );
});

Float.displayName = "Form.Float";

export default Float;
