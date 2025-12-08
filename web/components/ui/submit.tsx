import { useState } from "react";
import { Submit as BaseSubmit } from "../form/Submit";
import { useNotificacion } from "./notification";
import { useEventEmitter } from "../util/event-emitter";

interface SubmitProps<T = unknown>
  extends Omit<React.ComponentProps<"button">, "type" | "onSubmit"> {
  onSubmit: (payload: T) => Promise<void> | void;
  event?: symbol;
  disableSuccessNotification?: boolean;
}

/**
 * Enhanced Submit button with notification handling and debounced loading state.
 * Built on top of the base Submit component from form/Submit.
 *
 * @template T - The type of the form state payload received in onSubmit
 */
export default function Submit<T = unknown>({
  onSubmit,
  event,
  disableSuccessNotification = false,
  children,
  ...props
}: SubmitProps<T>) {
  const [showLoading, setShowLoading] = useState(false);
  const emitter = useEventEmitter();
  const notify = useNotificacion();

  // Debounce loading visual state by 50ms
  const handleLoadingChange = (loading: boolean) => {
    if (loading) {
      const timeout = setTimeout(() => setShowLoading(true), 50);
      return () => clearTimeout(timeout);
    } else {
      setShowLoading(false);
    }
  };

  // Wrap onSubmit with notification handling
  const handleSubmit = async (payload: T) => {
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("payload", { onSubmit, payload });
      }

      const result = await onSubmit(payload);

      if (!disableSuccessNotification) {
        notify({
          type: "success",
          payload: "Guardado exitosamente",
        });
      }

      if (event) {
        emitter.emit(event, result);
      }

      return result;
    } catch (error) {
      notify({
        type: "error",
        payload: error instanceof Error ? error : "Error al guardar",
      });
    }
  };

  return (
    <BaseSubmit<T>
      onSubmit={handleSubmit}
      onLoadingChange={handleLoadingChange}
      {...props}
    >
      {showLoading ? "Guardando..." : children}
    </BaseSubmit>
  );
}
