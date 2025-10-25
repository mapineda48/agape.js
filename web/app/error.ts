import { notifyError } from "@agape/spa";

if (process.env.NODE_ENV !== "development") {
    // 2.1 Errores sincronizados
    window.addEventListener("error", (event) => {
        const stack =
            event.error?.stack ||
            `${event.message} en ${event.filename}:${event.lineno}:${event.colno}`;

        notifyError(stack).then(() => { }).catch(() => { });
    });

    // 2.2 Rechazos de promesas no manejados
    window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        const stack = reason?.stack || JSON.stringify(reason);

        notifyError(stack).then(() => { }).catch(() => { });
    });
}