import React from "react";
import useInput from "../Input/useInput";
import { usePaths } from "../paths";
import { stringToPath } from "#web/utils/stringToPath";

export interface IntProps {
  path?: string;
  materialize?: boolean;
  autoCleanup?: boolean;
  onChange?: (value: number, index: number) => void;
  required?: boolean;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

const SelectInt = ({
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
}: IntProps) => {
  const paths = usePaths(stringToPath(path));
  const { value, setValue } = useInput<number>(paths, 0, {
    materialize,
    autoCleanup,
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const numVal = parseInt(val, 10);
    const finalVal = isNaN(numVal) ? 0 : numVal;

    setValue(finalVal);

    if (onChange) {
      // Find index of the selected value among children for backward compatibility
      const childrenArray = React.Children.toArray(children);
      const index = childrenArray.findIndex(
        (child) =>
          React.isValidElement(child) &&
          String((child.props as { value?: unknown }).value) === val
      );
      onChange(finalVal, index);
    }
  };

  return (
    <select
      value={String(value ?? 0)}
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

export default SelectInt;
