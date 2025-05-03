import { JSX } from "react";
import { useInput } from "..";

export default function SelectBoolean(props: Props) {
  const { path, ...core } = props;

  const [state, setState] = useInput(path, false);

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
  path: string;
}

type Core = Omit<
  JSX.IntrinsicElements["select"],
  "value" | "name" | "onChange" | "type"
>;
