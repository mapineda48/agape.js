import net from 'node:net';

const SOCKET_PATH = '/run/mapineda48.sock'; // coincide con tu .socket
const CONNECT_TIMEOUT_MS = 3000;   // tiempo para conectar
const RESPONSE_TIMEOUT_MS = 60_000; // tiempo para esperar la respuesta (pull + compose)

export async function sendCommand(cmd: string) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(SOCKET_PATH);

    // timeouts
    const timerConn = setTimeout(() => {
      client.destroy();
      reject(new Error(`Timeout de conexión a ${SOCKET_PATH}`));
    }, CONNECT_TIMEOUT_MS);

    const timerResp = setTimeout(() => {
      client.destroy();
      reject(new Error(`Timeout esperando respuesta del servidor`));
    }, RESPONSE_TIMEOUT_MS);

    let buf = '';

    client.on('connect', () => {
      clearTimeout(timerConn);
      // IMPORTANTE: termina con \n (handler usa read -r cmd)
      client.write(cmd + '\n');
    });

    client.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      // protocolo simple una-línea; si llega \n asumimos respuesta completa
      if (buf.includes('\n')) {
        const line = buf.split('\n')[0].replace(/\r$/, '');
        clearTimeout(timerResp);
        client.end();
        resolve(line);
      }
    });

    client.on('end', () => {
      // si cerró sin \n, devolver lo que haya
      if (buf && !buf.includes('\n')) {
        clearTimeout(timerResp);
        resolve(buf.replace(/\r$/, ''));
      }
    });

    client.on('error', (err) => {
      clearTimeout(timerConn);
      clearTimeout(timerResp);
      reject(err);
    });
  });
}