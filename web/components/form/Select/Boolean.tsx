import React from "react";
import { Select, SelectItem } from "../../ui/select";
import useInput from "../Input/useInput";

export interface BooleanProps {
  path: string;
  materialize?: boolean;
  autoCleanup?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const SelectBoolean = ({
  path,
  materialize,
  autoCleanup,
  placeholder = "Seleccionar...",
  className,
  disabled,
  required,
}: BooleanProps) => {
  const [state, setState] = useInput<boolean>(path, false, {
    materialize,
    autoCleanup,
  });

  return (
    <Select
      value={state}
      onChange={(val) => setState(val)}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      required={required}
    >
      <SelectItem value={true}>Sí</SelectItem>
      <SelectItem value={false}>No</SelectItem>
    </Select>
  );
};

export default SelectBoolean;
