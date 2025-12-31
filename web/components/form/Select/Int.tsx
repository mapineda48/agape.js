import React from "react";
import { Select, SelectItem } from "../../ui/select";
import useInput from "../Input/useInput";

export interface IntProps {
  path: string;
  materialize?: boolean;
  autoCleanup?: boolean;
  onChange?: (value: number) => void;
  required?: boolean;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SelectInt = ({
  path,
  materialize,
  autoCleanup,
  onChange,
  children,
  placeholder,
  className,
  disabled,
  required,
}: IntProps) => {
  const [state, setState] = useInput<number>(path, 0, {
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

export default SelectInt;
