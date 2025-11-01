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
    console.log(`sending to bridge ""${cmd}""`)
    return new Promise((res, rej) => {
        const bridge = net.createConnection({ host: 'mapineda48-socket-bridge', port: 8081 });
        let buf = '';
        bridge.setNoDelay(true);
        bridge.on('connect', () => bridge.write(`${cmd}\n`));
        bridge.on('data', c => { buf += c.toString('utf8'); if (buf.includes('\n')) { bridge.end(); res(buf.trim()); } });
        bridge.on('error', rej);
        bridge.setTimeout(60000, () => { bridge.destroy(); rej(new Error('timeout')); });
    });
}