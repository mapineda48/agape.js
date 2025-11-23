import { type JSX } from "react";
import useInput from "./useInput";
import DateTime from "@utils/data/DateTime";
import { format } from "date-fns";

export default function InputDateTime(props: Props) {
  const { path, ...core } = props;

  // Default to now if no value
  const [state, setState] = useInput<DateTime>(path, new DateTime());

  const displayValue =
    state instanceof Date ? format(state, "yyyy-MM-dd'T'HH:mm") : "";

  return (
    <input
      {...core}
      type="datetime-local"
      value={displayValue}
      onChange={({ currentTarget }) => {
        const date = new Date(currentTarget.value);
        if (!isNaN(date.getTime())) {
          setState(new DateTime(date));
        }
      }}
    />
  );
}

interface Props extends Core {
  path: string;
}

type Core = Omit<
  JSX.IntrinsicElements["input"],
  "value" | "name" | "onChange" | "type"
>;
