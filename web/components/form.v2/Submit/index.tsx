import { createElement, useEffect, type JSX } from "react";
import { useEvent } from "../provider";
import { useMitt } from "@/components/util/event-emiter";

export function Submit({ onSubmit, ...core }: Props) {
  const event = useEvent();
  const emitter = useMitt();

  console.log(event);

  useEffect(() => {
    return emitter.on(event.SUBMIT, onSubmit);
  }, [emitter, onSubmit]);

  return createElement("button", {
    ...core,
    type: "submit",
  });
}

export interface Props extends Core {
  onSubmit: <T>(state: T) => void;
}

type Core = Omit<JSX.IntrinsicElements["button"], "type">;
