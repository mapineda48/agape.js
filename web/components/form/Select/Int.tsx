import { type JSX } from "react";
import useInput from "../Input/useInput";

export default function SelectInt(props: Props) {
  const { path, onChange, materialize, ...core } = props;

  const [state, setState] = useInput(path, 0, { materialize });

  return (
    <select
      {...core}
      name={path}
      value={state as number}
      onChange={({ currentTarget }) => {
        const index = currentTarget.selectedIndex;
        const value = parseInt(currentTarget.value) ?? 0;

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
  onChange?: (value: number, index: number) => void;
}

type Core = Omit<
  JSX.IntrinsicElements["select"],
  "value" | "name" | "onChange" | "type"
>;
