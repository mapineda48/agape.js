import { createElement, useEffect, type JSX } from "react";
import { useEvent } from "../provider";
import { useEventEmitter } from "@/components/util/event-emitter";

export function Submit({ onSubmit, ...core }: Props) {
  const event = useEvent();
  const emitter = useEventEmitter();

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
