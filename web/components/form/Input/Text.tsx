import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "@/utils/stringToPath";

/**
 * Props for the Text input component.
 */
export interface TextProps
  extends Omit<
    JSX.IntrinsicElements["input"],
    "value" | "onChange" | "type" | "defaultValue"
  > {
  /** Path within the form store (e.g. "user.name" or just "name") */
  path: string | number;
  /** Input type: text, email, or password */
  type?: "text" | "email" | "password";
  /**
   * Default value used when no value exists in the store.
   * Only used on initial mount - changes to this prop are ignored.
   */
  defaultValue?: string;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
}

/**
 * Text input field connected to the form store.
 * Supports text, email, and password types.
 *
 * @example
 * ```tsx
 * <Form.Text path="user.name" placeholder="Enter name" />
 * <Form.Text path="email" type="email" />
 * <Form.Text path="password" type="password" />
 * ```
 */
const Text = forwardRef<HTMLInputElement, TextProps>((props, ref) => {
  const {
    path,
    type = "text",
    defaultValue = "",
    materialize,
    autoCleanup,
    ...core
  } = props;

  const paths = useMemo(() => stringToPath(path), [path]);

  const [state, setState] = useInput(paths, defaultValue, {
    materialize,
    autoCleanup,
  });

  return (
    <input
      {...core}
      ref={ref}
      type={type}
      value={state as string}
      onChange={(e) => setState(e.currentTarget.value)}
    />
  );
});

Text.displayName = "Form.Text";

export default Text;
