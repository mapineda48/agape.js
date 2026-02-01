import React from "react";
import useInput from "../Input/useInput";
import { usePaths } from "../paths";
import { stringToPath } from "#web/utils/stringToPath";

export interface BooleanProps {
  path?: string;
  materialize?: boolean;
  autoCleanup?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

const SelectBoolean = ({
  path = "",
  materialize,
  autoCleanup,
  placeholder = "Seleccionar...",
  className,
  disabled,
  required,
  "data-testid": testId,
}: BooleanProps) => {
  const paths = usePaths(stringToPath(path));
  const { value, setValue } = useInput<boolean>(paths, false, {
    materialize,
    autoCleanup,
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value === "true";
    setValue(newValue);
  };

  return (
    <select
      value={String(value ?? false)}
      onChange={handleChange}
      className={className}
      disabled={disabled}
      required={required}
      data-testid={testId}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      <option value="true">Sí</option>
      <option value="false">No</option>
    </select>
  );
};

export default SelectBoolean;
