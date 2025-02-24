const hybridLogger = () => {
    if (typeof window === "undefined") {
        console.log("👋 Hola desde el servidor");
    } else {
        console.log("🌍 Hola desde el navegador");
    }
};

export const logMessage = () => hybridLogger();
