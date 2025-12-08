import { useState } from "react";
import { Submit as BaseSubmit, type Props } from "../form/Submit";
import { useNotificacion } from "./notification";

/**
 * Enhanced Submit button with notification handling and debounced loading state.
 * Built on top of the base Submit component from form/Submit.
 *
 * @template T - The type of the form state payload received in onSubmit
 */
export default function Submit<T = unknown>({
  onError,
  onSuccess,
  children,
  ...props
}: Props<T>) {
  const [showLoading, setShowLoading] = useState(false);
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

  return (
    <BaseSubmit<T>
      {...props}
      onError={onError ? onError : (error: any) => notify({ payload: error })}
      onSuccess={
        onSuccess
          ? onSuccess
          : () => notify({ payload: "Guardado exitosamente" })
      }
      onLoadingChange={handleLoadingChange}
    >
      {showLoading ? "Guardando..." : children}
    </BaseSubmit>
  );
}
