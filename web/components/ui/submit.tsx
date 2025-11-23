import { useEffect, useState } from "react";
import Button from "./button";
import { useNotificacion } from "./notification";
import { useEventEmitter } from "../util/event-emitter";
import { useEvent as useForm } from "../form/provider";

interface SubmitProps extends React.ComponentProps<typeof Button> {
  onSubmit: (payload: any) => Promise<any>;
  text?: string;
  event?: symbol;
  disableSuccessNotification?: boolean;
}

export default function Submit({
  onSubmit,
  text = "Guardar",
  className,
  event,
  disableSuccessNotification = false,
  ...props
}: SubmitProps) {
  const [loading, setLoading] = useState(false);
  const emitter = useEventEmitter();
  const { SUBMIT, SUBMIT_SUCCESS } = useForm();
  const notify = useNotificacion();

  useEffect(() => {
    const unsubscribe = emitter.on(SUBMIT, async (payload: any) => {
      setLoading(true);
      try {
        const result = await onSubmit(payload);
        if (!disableSuccessNotification) {
          notify({
            type: "success",
            payload: "Guardado exitosamente",
          });
        }

        emitter.emit(SUBMIT_SUCCESS, payload);
        if (event) {
          emitter.emit(event, result);
        }
      } catch (error) {
        console.error(error);
        notify({
          type: "error",
          payload: error instanceof Error ? error : "Error al guardar",
        });
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [emitter, SUBMIT, onSubmit, notify, event, disableSuccessNotification]);

  return (
    <Button
      type="submit"
      className={className}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Guardando..." : text}
    </Button>
  );
}
