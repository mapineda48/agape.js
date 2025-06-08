import notifyStackWeb from "@agape/web-error";

if (process.env.NODE_ENV !== "development") {
    // 2.1 Errores sincronizados
    window.addEventListener("error", (event) => {
        const stack =
            event.error?.stack ||
            `${event.message} en ${event.filename}:${event.lineno}:${event.colno}`;

        notifyStackWeb(stack).then(() => { }).catch(() => { });
    });

    // 2.2 Rechazos de promesas no manejados
    window.addEventListener("unhandledrejection", (event) => {
        const reason = event.reason;
        const stack = reason?.stack || JSON.stringify(reason);

        notifyStackWeb(stack).then(() => { }).catch(() => { });
    });
}