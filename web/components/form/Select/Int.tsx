import { forwardRef, type JSX } from "react";
import useInput from "../Input/useInput";

/**
 * Props for the Int select component.
 */
export interface IntProps
  extends Omit<JSX.IntrinsicElements["select"], "value" | "onChange"> {
  /** Path within the form store */
  path: string;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
  /** Callback when selection changes */
  onChange?: (value: number, index: number) => void;
}

/**
 * Integer dropdown select connected to the form store.
 * Option values are parsed as integers.
 *
 * @example
 * ```tsx
 * <Form.Select.Int path="priority">
 *   <option value="1">Low</option>
 *   <option value="2">Medium</option>
 *   <option value="3">High</option>
 * </Form.Select.Int>
 * ```
 */
const SelectInt = forwardRef<HTMLSelectElement, IntProps>((props, ref) => {
  const { path, materialize, autoCleanup, onChange, children, ...core } = props;

  const [state, setState] = useInput<number>(path, 0, {
    materialize,
    autoCleanup,
  });

  return (
    <select
      {...core}
      ref={ref}
      value={state as number}
      onChange={(e) => {
        const raw = e.currentTarget.value;
        const index = e.currentTarget.selectedIndex;
        const parsed = parseInt(raw, 10);
        const value = Number.isNaN(parsed) ? 0 : parsed;
        setState(value);
        onChange?.(value, index);
      }}
    >
      {children}
    </select>
  );
});

SelectInt.displayName = "Form.Select.Int";

export default SelectInt;
