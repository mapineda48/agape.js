import cors from "cors";
import helmet from "helmet";


export default function origin(isDev: boolean, storageHost: string) {
    if (isDev) {
        //SPA - React Application

        return cors({ origin: "http://localhost:3000", credentials: true })
    }


    return helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "img-src": [
                    ...helmet.contentSecurityPolicy.getDefaultDirectives()['img-src'], // Conserva las directivas por defecto de 'img-src'
                    "blob:",
                    storageHost, // Agrega tu fuente personalizada
                ],
            },
        },
    })
}