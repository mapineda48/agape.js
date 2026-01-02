import React from "react";
import { Select, SelectItem } from "../../ui/select";
import useInput from "../Input/useInput";

export interface IntProps {
  path: string;
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
  path,
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
  const [state, setState] = useInput<number>(path, 0, {
    materialize,
    autoCleanup,
  });

  return (
    <Select
      value={state}
      onChange={(val) => {
        const numVal = typeof val === "string" ? parseInt(val, 10) : Number(val);
        const finalVal = isNaN(numVal) ? 0 : numVal;

        setState(finalVal);

        if (onChange) {
          // Find index of the selected value among children for backward compatibility
          const childrenArray = React.Children.toArray(children);
          const index = childrenArray.findIndex((child: any) =>
            String(child.props.value) === String(val)
          );
          onChange(finalVal, index);
        }
      }}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
      data-testid={testId}
    >
      {children}
    </Select>
  );
};

export default SelectInt;
