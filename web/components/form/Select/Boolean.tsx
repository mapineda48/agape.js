import { forwardRef, type JSX } from "react";
import useInput from "../Input/useInput";

/**
 * Props for the Boolean select component.
 */
export interface BooleanProps
  extends Omit<JSX.IntrinsicElements["select"], "value" | "onChange"> {
  /** Path within the form store */
  path: string;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
}

/**
 * Boolean dropdown select connected to the form store.
 * Renders "Sí" and "No" options.
 *
 * @example
 * ```tsx
 * <Form.Select.Boolean path="isActive" />
 * ```
 */
const SelectBoolean = forwardRef<HTMLSelectElement, BooleanProps>(
  (props, ref) => {
    const { path, materialize, autoCleanup, ...core } = props;

    const [state, setState] = useInput<boolean>(path, false, {
      materialize,
      autoCleanup,
    });

    return (
      <select
        {...core}
        ref={ref}
        value={state ? "true" : "false"}
        onChange={(e) => setState(e.currentTarget.value === "true")}
      >
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    );
  }
);

SelectBoolean.displayName = "Form.Select.Boolean";

export default SelectBoolean;
