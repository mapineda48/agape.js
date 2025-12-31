import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "@/utils/stringToPath";

/**
 * Props for the TextArea input component.
 */
export interface TextAreaProps
  extends Omit<
    JSX.IntrinsicElements["textarea"],
    "value" | "onChange" | "defaultValue"
  > {
  /** Path within the form store (e.g. "description" or "comments.0.text") */
  path: string | number;
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
 * Multi-line text area connected to the form store.
 *
 * @example
 * ```tsx
 * <Form.TextArea path="description" rows={4} />
 * <Form.TextArea path="notes" placeholder="Add notes..." />
 * ```
 */
const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (props, ref) => {
    const {
      path,
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
      <textarea
        {...core}
        ref={ref}
        value={state as string}
        onChange={(e) => setState(e.currentTarget.value)}
      />
    );
  }
);

TextArea.displayName = "Form.TextArea";

export default TextArea;
