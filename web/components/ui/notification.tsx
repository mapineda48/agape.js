import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const enterTimeout = setTimeout(() => setVisible(true), 10);
        const exitTimeout = duration
            ? setTimeout(() => handleClose(), duration + 10)
            : undefined;

        return () => {
            clearTimeout(enterTimeout);
            if (exitTimeout) clearTimeout(exitTimeout);
        };
    }, [duration]);

    const handleClose = () => {
        setExiting(true);
        setVisible(false);
    };

    const message = isError ? payload.message : payload;
    const color = isError ? "error" : type;

    return (
        <div
            onTransitionEnd={() => {
                if (exiting) remove();
            }}
            className={`
                fixed top-[1em] left-1/2 transform -translate-x-1/2 z-50 
                transition-all duration-500 ease-in-out
                ${visible && !exiting ? "translate-y-0 opacity-100" : ""}
                ${!visible && !exiting ? "-translate-y-8 opacity-0" : ""}
                ${exiting ? "translate-x-full opacity-0" : ""}
            `}
        >
            <div
                className={`relative px-4 py-3 pr-10 rounded-lg border shadow-md min-w-[240px] flex items-start gap-2 ${colors[color]}`}
            >
                <span className="flex-1">{message}</span>
                <button
                    onClick={handleClose}
                    className="absolute top-1.5 right-1.5 text-sm text-inherit hover:text-black"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export const useNotificacion = withPortalToRoot(Notification);

interface NotificationProps extends PropsPortal {
    payload: string | Error;
    type?: "success" | "warning" | "error";
    duration?: number;
}
