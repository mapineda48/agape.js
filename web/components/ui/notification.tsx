import { useEffect, useState } from "react";
import {
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  type LucideIcon,
} from "lucide-react";
import {
  createPortalHook,
  type PortalInjectedProps,
} from "@/components/util/portal";

type NotificationType = "success" | "warning" | "error" | "info";

const styles: Record<NotificationType, string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const icons: Record<NotificationType, LucideIcon> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const iconStyles: Record<NotificationType, string> = {
  success: "text-green-500",
  warning: "text-yellow-500",
  error: "text-red-500",
  info: "text-blue-500",
};

export default function Notification(props: NotificationProps) {
  const { payload, type = "success", duration = 4000, remove, style } = props;

  const isError = payload instanceof Error;
  const resolvedType: NotificationType = isError ? "error" : type;
  let message = isError ? payload.message : payload;

  if (typeof message !== "string") {
    console.error("Invalid message type", message);
    message = "Unknown error";
  }

  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Small delay to allow mounting before animating in
    const enterTimeout = setTimeout(() => setVisible(true), 50);

    let exitTimeout: number | undefined;
    if (duration && duration > 0) {
      exitTimeout = setTimeout(() => handleClose(), duration);
    }

    return () => {
      clearTimeout(enterTimeout);
      if (exitTimeout) clearTimeout(exitTimeout);
    };
  }, [duration]);

  const handleClose = () => {
    setExiting(true);
    setVisible(false);
  };

  const Icon = icons[resolvedType];

  return (
    <div
      style={style}
      onTransitionEnd={() => {
        if (exiting) remove();
      }}
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-[2000]
        transition-all duration-300 ease-out
        ${visible && !exiting ? "translate-y-0 opacity-100 scale-100" : ""}
        ${!visible && !exiting ? "-translate-y-4 opacity-0 scale-95" : ""}
        ${exiting ? "-translate-y-4 opacity-0 scale-95" : ""}
      `}
    >
      <div
        className={`
          relative flex items-start gap-3 p-4 pr-12
          rounded-xl border shadow-lg backdrop-blur-sm
          min-w-[320px] max-w-[90vw]
          ${styles[resolvedType]}
        `}
        role="alert"
      >
        <Icon
          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconStyles[resolvedType]}`}
        />

        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>

        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
}

export const useNotificacion = createPortalHook(Notification);

interface NotificationProps extends PortalInjectedProps {
  payload: string | Error;
  type?: NotificationType;
  duration?: number;
}
