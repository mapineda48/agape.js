import { forwardRef, type JSX } from "react";
import useInput from "../Input/useInput";

/**
 * Props for the String select component.
 */
export interface StringProps
  extends Omit<JSX.IntrinsicElements["select"], "value" | "onChange"> {
  /** Path within the form store */
  path: string;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
  /** Callback when selection changes */
  onChange?: (value: string, index: number) => void;
}

/**
 * String dropdown select connected to the form store.
 *
 * @example
 * ```tsx
 * <Form.Select.String path="status">
 *   <option value="active">Active</option>
 *   <option value="inactive">Inactive</option>
 * </Form.Select.String>
 * ```
 */
const SelectString = forwardRef<HTMLSelectElement, StringProps>(
  (props, ref) => {
    const { path, materialize, autoCleanup, onChange, children, ...core } =
      props;

    const [state, setState] = useInput<string>(path, "", {
      materialize,
      autoCleanup,
    });

    return (
      <select
        {...core}
        ref={ref}
        value={state as string}
        onChange={(e) => {
          const value = e.currentTarget.value;
          const index = e.currentTarget.selectedIndex;
          setState(value);
          onChange?.(value, index);
        }}
      >
        {children}
      </select>
    );
  }
);

SelectString.displayName = "Form.Select.String";

export default SelectString;
