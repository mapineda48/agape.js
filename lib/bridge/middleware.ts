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
        
        // 1. Necesitas un 'buffer' para acumular la respuesta, 
        // ya que puede llegar en varios trozos (chunks).
        let buf = '';

        bridge.on('connect', () => {
            // 2. Al conectar, simplemente escribes el comando.
            // NO cierras la conexión aquí.
            bridge.write(`${cmd}\n`);
        });

        // 3. Este es el listener clave. Se dispara CADA vez que
        // el socket recibe datos (la respuesta del script sh).
        bridge.on('data', c => { 
            buf += c.toString('utf8'); // Acumulas los datos en el buffer

            // 4. Verificas si la respuesta ya está completa.
            // Asumimos que la respuesta termina con un salto de línea ('\n').
            if (buf.includes('\n')) { 
                bridge.end(); // Ahora sí cierras la conexión
                res(buf.trim()); // Resuelves la promesa con la respuesta limpia
            } 
        });

        bridge.on('error', rej); // Manejo de errores

        // 5. Un timeout para toda la operación (conectar, enviar Y esperar)
        bridge.setTimeout(60000, () => { // 60 segundos
            bridge.destroy(); 
            rej(new Error('timeout (60s)')); 
        });
    });
}