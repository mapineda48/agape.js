import { useMemo, forwardRef, type JSX } from "react";
import useInput from "./useInput";
import stringToPath from "#web/utils/stringToPath";
import { useFieldContextOptional } from "../Field/context";

/**
 * Props for the File input component.
 */
export interface FileProps
  extends Omit<JSX.IntrinsicElements["input"], "value" | "onChange" | "type"> {
  /** Path within the form store (e.g. "avatar" or "attachments.0") */
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
 * File input connected to the form store.
 * Supports single and multiple file selection.
 * Integrates with Form.Field for automatic validation.
 *
 * @example
 * ```tsx
 * <Form.File path="avatar" accept="image/*" />
 * <Form.File path="documents" multiple />
 * ```
 */
const FileInput = forwardRef<HTMLInputElement, FileProps>((props, ref) => {
  const {
    path: pathProp,
    multiple,
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

  const { value, onChange, onBlur } = useInput<File | File[] | null>(
    paths,
    multiple ? [] : null,
    { materialize, autoCleanup, validateOnChange, validateOnBlur }
  );

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
      type="file"
      multiple={multiple}
      onChange={({ currentTarget }) => {
        const filesArray = Array.from(currentTarget.files ?? []);

        if (!filesArray.length) {
          return;
        }

        if (!multiple) {
          onChange(filesArray[0]);
          return;
        }

        const currents = (value as File[]) || [];
        onChange([...currents, ...filesArray]);
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

FileInput.displayName = "Form.File";

export default FileInput;
