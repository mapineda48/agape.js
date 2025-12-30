import { createElement, useEffect, useRef, useState, type JSX } from "react";
import { useEvent, type SubmitEventPayload } from "../provider";
import { useEventEmitter } from "@/components/util/event-emitter";

export function Submit<T = unknown>({
  onSubmit,
  onError,
  onSuccess,
  onLoadingChange,
  children,
  disabled,
  ...core
}: Props<T>) {
  const [loading, setLoading] = useState(false);
  const event = useEvent();
  const emitter = useEventEmitter();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Notify parent component when loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const handler = async (args: unknown) => {
      let formData: T;
      let submitter: HTMLElement | null | undefined;

      if (isSubmitEventPayload<T>(args)) {
        formData = args.payload;
        submitter = args.submitter;
      } else {
        formData = args as T;
      }

      // If a specific submitter triggered the event, ensure it matches this button
      if (submitter && buttonRef.current && submitter !== buttonRef.current) {
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.log("formData", formData);
      }

      setLoading(true);
      try {
        const payload = await onSubmit(formData);
        onSuccess?.(payload);
        emitter.emit(event.SUBMIT_SUCCESS, payload);
      } catch (error) {
        onError?.(error);

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
    ref: buttonRef,
    type: "submit",
    disabled: loading || disabled,
    children,
  });
}

function isSubmitEventPayload<T>(data: unknown): data is SubmitEventPayload<T> {
  return (
    typeof data === "object" &&
    data !== null &&
    "submitter" in data &&
    "payload" in data
  );
}

export interface Props<T = unknown> extends Core {
  onSubmit: (state: T) => Promise<unknown>;
  onError?: (error: unknown) => void;
  onSuccess?: <P>(payload: P) => void;
  onLoadingChange?: (loading: boolean) => void;
}

type Core = Omit<JSX.IntrinsicElements["button"], "type" | "onSubmit">;
