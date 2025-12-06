import { type JSX } from "react";
import useInput from "../Input/useInput";

export default function SelectString(props: Props) {
  const { path, onChange, materialize, autoCleanup, ...core } = props;

  const [state, setState] = useInput(path, "", { materialize, autoCleanup });

  return (
    <select
      {...core}
      name={path}
      value={state as string}
      onChange={({ currentTarget }) => {
        const index = currentTarget.selectedIndex;
        const value = currentTarget.value;

        setState(value);

        if (onChange) {
          onChange(value, index);
        }
      }}
    />
  );
}

interface Props extends Core {
  path: string;
  default?: boolean;
  materialize?: boolean;
  /** If true, the value will be removed from the store when this input unmounts */
  autoCleanup?: boolean;
  onChange?: (value: string, index: number) => void;
}

type Core = Omit<
  JSX.IntrinsicElements["select"],
  "value" | "name" | "onChange" | "type"
>;
