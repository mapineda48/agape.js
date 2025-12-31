import React from "react";
import { Select, SelectItem } from "../../ui/select";
import useInput from "../Input/useInput";

export interface StringProps {
  path: string;
  materialize?: boolean;
  autoCleanup?: boolean;
  onChange?: (value: string) => void;
  required?: boolean;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SelectString = ({
  path,
  materialize,
  autoCleanup,
  onChange,
  children,
  placeholder,
  className,
  disabled,
  required,
}: StringProps) => {
  const [state, setState] = useInput<string>(path, "", {
    materialize,
    autoCleanup,
  });

  return (
    <Select
      value={state}
      onChange={(val) => {
        setState(val);
        onChange?.(val);
      }}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
    >
      {children}
    </Select>
  );
};

export default SelectString;
