import { createElement, useEffect, useState, type JSX } from "react";
import { useEvent } from "../provider";
import { useEventEmitter } from "@/components/util/event-emitter";

export function Submit({
  onSubmit,
  children,
  disabled,
  onLoadingChange,
  ...core
}: Props) {
  const [loading, setLoading] = useState(false);
  const event = useEvent();
  const emitter = useEventEmitter();

  // Notify parent component when loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const unsubscribe = emitter.on(event.SUBMIT, async (payload: any) => {
      setLoading(true);
      try {
        await onSubmit(payload);
        emitter.emit(event.SUBMIT_SUCCESS, payload);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [emitter, event.SUBMIT, event.SUBMIT_SUCCESS, onSubmit]);

  return createElement("button", {
    ...core,
    type: "submit",
    disabled: loading || disabled,
    children,
  });
}

export interface Props extends Core {
  onSubmit: (state: any) => Promise<any>;
  onLoadingChange?: (loading: boolean) => void;
}

type Core = Omit<JSX.IntrinsicElements["button"], "type">;
