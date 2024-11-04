import { useInput } from "..";

export default function SelectBoolean(props: Props) {
  const { name, ...core } = props;

  const [state, setState] = useInput(name, false);

  return (
    <select
      {...core}
      value={state ? "true" : "false"}
      onChange={({ currentTarget }) => setState(currentTarget.value === "true")}
    >
      <option value="true">Si</option>
      <option value="false">No</option>
    </select>
  );
}

interface Props extends Core {
  name: string;
}

type Core = Omit<
  JSX.IntrinsicElements["select"],
  "value" | "name" | "onChange" | "type"
>;
