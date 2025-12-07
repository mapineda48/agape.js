import { useState } from "react";
import { Submit as BaseSubmit } from "../form/Submit";
import { useNotificacion } from "./notification";
import { useEventEmitter } from "../util/event-emitter";

interface SubmitProps extends Omit<React.ComponentProps<"button">, "type"> {
  onSubmit: (payload: any) => Promise<any>;
  event?: symbol;
  disableSuccessNotification?: boolean;
}

/**
 * Enhanced Submit button with notification handling and debounced loading state.
 * Built on top of the base Submit component from form/Submit.
 */
export default function Submit({
  onSubmit,
  event,
  disableSuccessNotification = false,
  children,
  ...props
}: SubmitProps) {
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
  const handleSubmit = async (payload: any) => {
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
    <BaseSubmit
      onSubmit={handleSubmit}
      onLoadingChange={handleLoadingChange}
      {...props}
    >
      {showLoading ? "Guardando..." : children}
    </BaseSubmit>
  );
}
