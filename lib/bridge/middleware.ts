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
  console.log(`sending to bridge "${cmd}"`);
  return new Promise<string>((res, rej) => {
    const s = net.createConnection({ host: 'mapineda48-socket-bridge', port: 8081 }, () => {
      // Enviamos la línea y cerramos SOLO el lado de escritura
      s.end(`${cmd}\n`, 'utf8');
    });

    s.setEncoding('utf8');

    let buf = '';
    s.on('data', chunk => { buf += chunk; });
    s.on('end', () => { res(buf.trim()); });   // espera a que el servidor cierre
    s.on('error', rej);
    s.setTimeout(60000, () => { s.destroy(); rej(new Error('timeout')); });
  });
}