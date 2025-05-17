import { JSX } from "react";
import { useInput } from "..";

export default function SelectInt(props: Props) {
  const { path, onChange, ...core } = props;

  const [state, setState] = useInput(path, 0);

  return (
    <select
      {...core}
      value={state}
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
  onChange?: (value: number, index: number) => void;
}

type Core = Omit<
  JSX.IntrinsicElements["select"],
  "value" | "name" | "onChange" | "type"
>;
