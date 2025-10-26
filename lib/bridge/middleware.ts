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
    return new Promise((res, rej) => {
        const s = net.createConnection({ host: 'mapineda48-socket-bridge', port: 8081 });
        let buf = '';
        s.on('connect', () => s.write(`'${cmd}\n'`));
        s.on('data', c => { buf += c.toString('utf8'); if (buf.includes('\n')) { s.end(); res(buf.trim()); } });
        s.on('error', rej);
        s.setTimeout(60000, () => { s.destroy(); rej(new Error('timeout')); });
    });
}