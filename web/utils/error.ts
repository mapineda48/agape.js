import { notifyError } from "@agape/spa";

if (process.env.NODE_ENV !== "development") {
  // 2.1 Errores sincronizados
  window.addEventListener("error", (event) => {
    let stack = event.error?.stack;

    // Fallback si no hay stack (ej. errores de carga de recursos o cross-origin)
    if (!stack) {
      stack = `Error: ${event.message}\n    at ${event.filename}:${event.lineno}:${event.colno}`;
    }

    notifyError(stack)
      .then(() => {})
      .catch(() => {});
  });

  // 2.2 Rechazos de promesas no manejados
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    let stack = reason?.stack;

    if (!stack) {
      stack = typeof reason === "string" ? reason : JSON.stringify(reason);
    }

    notifyError(stack)
      .then(() => {})
      .catch(() => {});
  });
}

export function checkError(error: Error) {
  console.error(error);

  const stack = error?.stack || error.message;

  notifyError(stack)
    .then(() => {})
    .catch(() => {});
}
