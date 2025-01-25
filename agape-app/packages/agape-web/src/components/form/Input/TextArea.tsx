import { useInput } from "..";

export default function InputTextArea(props: Props) {
  const { name, ...core } = props;

  const [state, setState] = useInput(name, "");

  return (
    <textarea
      {...core}
      value={state}
      onChange={({ currentTarget }) => setState(currentTarget.value)}
    />
  );
}

interface Props extends Core {
  name: string;
}

type Core = Omit<
  JSX.IntrinsicElements["textarea"],
  "value" | "name" | "onChange" | "type"
>;
