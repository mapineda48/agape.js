import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "#web/utils/stringToPath";
import Decimal from "#shared/data/Decimal";
import { useFieldContextOptional } from "../Field/context";

/**
 * Props for the Decimal input component.
 */
export interface DecimalProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store (e.g. "price" or "item.0.amount") */
  path?: string | number | (string | number)[];
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
 * High-precision decimal input connected to the form store.
 * Uses Decimal.js for accurate decimal arithmetic.
 * Integrates with Form.Field for automatic validation.
 *
 * @example
 * ```tsx
 * <Form.Decimal path="price" step="0.01" />
 * <Form.Decimal path="taxRate" />
 * ```
 */
const DecimalInput = forwardRef<HTMLInputElement, DecimalProps>(
  (props, ref) => {
    const {
      path: pathProp,
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

    const { value, onChange, onBlur } = useInput<Decimal>(
      paths,
      new Decimal(0),
      {
        materialize,
        autoCleanup,
        validateOnChange,
        validateOnBlur,
      }
    );

    // Use instanceof for type checking - more robust than duck-typing
    const displayValue =
      value instanceof Decimal ? value.toString() : value ?? "";

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
        step="0.01"
        value={displayValue}
        onChange={({ currentTarget }) => {
          try {
            const val = new Decimal(currentTarget.value || 0);
            onChange(val);
          } catch (e) {
            // Handle invalid input if necessary, or just don't update
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
  }
);

DecimalInput.displayName = "Form.Decimal";

export default DecimalInput;
