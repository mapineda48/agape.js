import net from "node:net";
import express from "express";

export default function useHook(secret: string) {
    const router = express.Router();

    router.post(`/${secret}/:cmd`, (req, res, next) => {
        sendCmd(req.params.cmd).then(payload => res.send(payload)).catch(err => next(err))
    });

    return router;
}

function sendCmd(cmd: string) {
    console.log(`sending to bridge ""${cmd}""`);
    return new Promise((res, rej) => {
        const bridge = net.createConnection({ host: 'mapineda48-socket-bridge', port: 8081 });

        bridge.on('connect', () => {
            // Escribe el comando y, en el callback, cierra la conexión
            bridge.write(`${cmd}\n`, (err) => {
                if (err) {
                    return rej(err); // Manejar error de escritura
                }
                // Escritura exitosa: cierra la conexión
                bridge.end();
                // Resuelve la promesa inmediatamente
                res('Comando enviado (sin esperar respuesta)');
            });
        });

        // Ya no necesitamos el listener 'data'
        // bridge.on('data', c => { ... });

        bridge.on('error', rej);
        // Podemos acortar el timeout, ya que solo es para conectar/escribir
        bridge.setTimeout(100000, () => { 
            bridge.destroy(); 
            rej(new Error('timeout (10s)')); 
        });
    });
}