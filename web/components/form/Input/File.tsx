import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "@/utils/stringToPath";

/**
 * Props for the File input component.
 */
export interface FileProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store (e.g. "avatar" or "attachments.0") */
  path: string | number;
  /** If true, writes the default value to the store on mount */
  materialize?: boolean;
  /** If true, removes the value from the store when unmounted */
  autoCleanup?: boolean;
}

/**
 * File input connected to the form store.
 * Supports single and multiple file selection.
 *
 * @example
 * ```tsx
 * <Form.File path="avatar" accept="image/*" />
 * <Form.File path="documents" multiple />
 * ```
 */
const FileInput = forwardRef<HTMLInputElement, FileProps>((props, ref) => {
  const { path, multiple, materialize, autoCleanup, ...core } = props;

  const paths = useMemo(() => stringToPath(path), [path]);

  const [state, setState] = useInput<File | File[] | null>(
    paths,
    multiple ? [] : null,
    { materialize, autoCleanup }
  );

  return (
    <input
      {...core}
      ref={ref}
      type="file"
      multiple={multiple}
      onChange={({ currentTarget }) => {
        const filesArray = Array.from(currentTarget.files ?? []);

        if (!filesArray.length) {
          return;
        }

        if (!multiple) {
          setState(filesArray[0]);
          return;
        }

        const currents = (state as File[]) || [];
        setState([...currents, ...filesArray]);
      }}
    />
  );
});

FileInput.displayName = "Form.File";

export default FileInput;
