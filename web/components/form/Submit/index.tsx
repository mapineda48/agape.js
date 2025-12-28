import { createElement, useEffect, useRef, useState, type JSX } from "react";
import { useEvent } from "../provider";
import { useEventEmitter } from "@/components/util/event-emitter";

export function Submit<T = unknown>({
  onSubmit,
  onError,
  onSuccess,
  onLoadingChange,
  children,
  disabled,
  onClick,
  ...core
}: Props<T>) {
  const [loading, setLoading] = useState(false);
  const event = useEvent();
  const emitter = useEventEmitter();

  // Track if this specific button was clicked to trigger the submit
  // This is used to prevent multiple Submit components from all handling
  // the same form submission event
  const wasClickedRef = useRef(false);

  // Notify parent component when loading state changes
  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const handler = async (formData: unknown) => {
      // Only process if this button was the one that triggered the submit
      if (!wasClickedRef.current) {
        return;
      }

      // Reset the flag immediately to prevent race conditions
      wasClickedRef.current = false;

      if (process.env.NODE_ENV === "development") {
        console.log("formData", formData);
      }

      setLoading(true);
      try {
        const payload = await onSubmit(formData as T);
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

  // Handle click to mark this button as the one that triggered the submit
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Mark this button as the one that was clicked
    wasClickedRef.current = true;

    // Call the original onClick if provided
    onClick?.(e);
  };

  return createElement("button", {
    ...core,
    type: "submit",
    disabled: loading || disabled,
    onClick: handleClick,
    children,
  });
}

export interface Props<T = unknown> extends Core {
  onSubmit: (state: T) => Promise<unknown>;
  onError?: (error: unknown) => void;
  onSuccess?: <P>(payload: P) => void;
  onLoadingChange?: (loading: boolean) => void;
}

type Core = Omit<JSX.IntrinsicElements["button"], "type" | "onSubmit">;
