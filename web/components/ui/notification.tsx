import { useEffect, useState } from "react";
import { X } from "lucide-react"; // Puedes usar cualquier ícono o uno SVG personalizado
import { withPortalToRoot, PropsPortal } from "../Portals";

const colors = {
    success: "bg-blue-100 text-blue-800 border-blue-300",
    warning: "bg-green-100 text-green-800 border-green-300",
    error: "bg-red-100 text-red-800 border-red-300",
};

export default function Notification(props: NotificationProps) {
    const {
        payload,
        type = "success",
        duration = 3000,
        remove,
    } = props;

    const isError = payload instanceof Error;

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Mostrar con delay para activar transición
        const enterTimeout = setTimeout(() => setVisible(true), 10);

        // Ocultar automáticamente si se define duración
        const exitTimeout = duration
            ? setTimeout(() => setVisible(false), duration + 10)
            : undefined;

        return () => {
            clearTimeout(enterTimeout);
            if (exitTimeout) clearTimeout(exitTimeout);
        };
    }, [duration]);


    const message = isError ? payload.message : payload;

    const color = isError ? "error" : type;
    
    return (
        <div
            onTransitionEnd={!visible ? remove : undefined}
            className={`fixed top-5 right-5 z-50 transform transition-all duration-500 ease-in-out
          ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
        >
            <div
                className={`relative px-4 py-3 pr-10 rounded-lg border shadow-md min-w-[240px] flex items-start gap-2 ${colors[color]}`}
            >
                <span className="flex-1">{message}</span>
                <button
                    onClick={() => setVisible(false)}
                    className="absolute top-1.5 right-1.5 text-sm text-inherit hover:text-black"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export const useNotificacion = withPortalToRoot(Notification);

/**
 * Types
 */

interface NotificationProps extends PropsPortal {
    payload: string | Error;
    type?: "success" | "warning" | "error";
    duration?: number; // tiempo en ms antes de ocultar automáticamente
};