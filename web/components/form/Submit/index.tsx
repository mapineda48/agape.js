import { createElement, useEffect, useState, type JSX } from "react";
import { useEvent } from "../provider";
import { useEventEmitter } from "@/components/util/event-emitter";

export function Submit<T = unknown>({
  onSubmit,
  children,
  disabled,
  onLoadingChange,
  ...core
}: Props<T>) {
  const [loading, setLoading] = useState(false);
  const event = useEvent();
  const emitter = useEventEmitter();

  // Notify parent component when loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const handler = async (payload: unknown) => {
      setLoading(true);
      try {
        await onSubmit(payload as T);
        emitter.emit(event.SUBMIT_SUCCESS, payload);
      } catch (error) {
        // Error is caught to prevent unhandled rejection.
        // The component recovers silently - SUBMIT_SUCCESS is not emitted.
        // Consumer can handle the error in onSubmit if needed.
        if (process.env.NODE_ENV === "development") {
          console.error("Submit error:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = emitter.on(event.SUBMIT, handler);

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

export interface Props<T = unknown> extends Core {
  onSubmit: (state: T) => Promise<void> | void;
  onLoadingChange?: (loading: boolean) => void;
}

type Core = Omit<JSX.IntrinsicElements["button"], "type" | "onSubmit">;
