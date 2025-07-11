// index.js
import { createClient, RESP_TYPES as TYPES } from 'redis';
import { encode, decode } from '@msgpack/msgpack';
//import { Buffer } from 'buffer';

async function main() {
  // 1. Conecta al servidor Redis
  const client = createClient();
  client.on('error', err => console.error('Redis Client Error', err));
  await client.connect();

  // 2. Empaqueta tu objeto y conviértelo a Buffer
  const original = {
    user: 'miguel',
    active: true,
    roles: ['admin', 'editor'],
    meta: { lastLogin: Date.now() }
  };
  const packedBuf = Buffer.from(encode(original));

  // 3. Guarda el Buffer en Redis
  await client.set('user:1001', packedBuf);

  const proxyClient = client.withTypeMapping({
  [TYPES.BLOB_STRING]: Buffer
});

  // 4. Recupera COMO Buffer usando el nuevo proxy client
  const buf = await client.withCommandOptions({
    typeMapping:{
         [TYPES.BLOB_STRING]: Buffer
    }
  })
    .get('user:1001');
  // buf es un Buffer nativo que podemos pasar a decode()
  const decoded = decode(buf);

  console.log('Original:', original);
  console.log('Decoded :', decoded);

  // 5. Cierra la conexión
  await client.disconnect();
}

main().catch(console.error);
