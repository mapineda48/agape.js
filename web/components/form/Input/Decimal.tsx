import { forwardRef, type JSX } from "react";
import useInput from "./useInput";
import Decimal from "@utils/data/Decimal";

/**
 * Props for the Decimal input component.
 */
export interface DecimalProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store */
  path: string;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
}

/**
 * High-precision decimal input connected to the form store.
 * Uses Decimal.js for accurate decimal arithmetic.
 *
 * @example
 * ```tsx
 * <Form.Decimal path="price" step="0.01" />
 * <Form.Decimal path="taxRate" />
 * ```
 */
const DecimalInput = forwardRef<HTMLInputElement, DecimalProps>(
  (props, ref) => {
    const { path, materialize, autoCleanup, ...core } = props;

    const [state, setState] = useInput<Decimal>(path, new Decimal(0), {
      materialize,
      autoCleanup,
    });

    // Use instanceof for type checking - more robust than duck-typing
    const displayValue =
      state instanceof Decimal ? state.toString() : state ?? "";

    return (
      <input
        {...core}
        ref={ref}
        type="number"
        step="0.01"
        value={displayValue}
        onChange={({ currentTarget }) => {
          try {
            const val = new Decimal(currentTarget.value || 0);
            setState(val);
          } catch (e) {
            // Handle invalid input if necessary, or just don't update
          }
        }}
      />
    );
  }
);

DecimalInput.displayName = "Form.Decimal";

export default DecimalInput;
