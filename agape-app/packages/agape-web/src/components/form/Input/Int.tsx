import { useInput } from "..";

export default function InputInt(props: Props) {
  const { name, ...core } = props;

  const [state, setState] = useInput(name, 0);

  return (
    <input
      {...core}
      type="number"
      value={isNaN(state) ? "" : state}
      onChange={({ currentTarget }) => setState(parseInt(currentTarget.value) ?? 0)}
    />
  );
}

interface Props extends Core {
  name: string;
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
