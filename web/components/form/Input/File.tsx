import { type JSX } from "react";
import { useInput } from "..";

export default function InputText(props: Props) {
  const { path, multiple, ...core } = props;

  const [, setState] = useInput(path, multiple ? [] : null);

  return (
    <input
      {...core}
      type="file"
      multiple={multiple}
      onChange={({ currentTarget }) => {
        const filesArray = Array.from(currentTarget.files ?? []);

        if (!filesArray.length) {
          return;
        }

        if (!multiple) {
          setState(filesArray[0]);
          return;
        }

        setState((currents: File[]) => [...currents, ...filesArray]);
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