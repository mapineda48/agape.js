import React from "react";
import useInput from "../Input/useInput";
import { usePaths } from "../paths";
import { stringToPath } from "#web/utils/stringToPath";

export interface StringProps {
  path?: string;
  materialize?: boolean;
  autoCleanup?: boolean;
  onChange?: (value: string) => void;
  required?: boolean;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

const SelectString = ({
  path = "",
  materialize,
  autoCleanup,
  onChange,
  children,
  placeholder,
  className,
  disabled,
  required,
  "data-testid": testId,
}: StringProps) => {
  const paths = usePaths(stringToPath(path));
  const { value, setValue } = useInput<string>(paths, "", {
    materialize,
    autoCleanup,
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(newValue);
  };

  return (
    <select
      value={value ?? ""}
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
      {children}
    </select>
  );
};

export default SelectString;
