import { useInput } from "..";

export default function SelectInt(props: Props) {
  const { name, onChange, ...core } = props;

  const [state, setState] = useInput(name, 0);

  return (
    <select
      {...core}
      value={state}
      onChange={({ currentTarget }) => {
        const value = parseInt(currentTarget.value) ?? 0;

        setState(value);

        if (onChange) {
          onChange(value);
        }
      }}
    />
  );
}

interface Props extends Core {
  name: string;
  onChange?: (value: number) => void;
}

type Core = Omit<
  JSX.IntrinsicElements["select"],
  "value" | "name" | "onChange" | "type"
>;
