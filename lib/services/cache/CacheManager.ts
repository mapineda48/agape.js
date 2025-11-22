import { createClient, RESP_TYPES } from "redis";
import { encode } from "#utils/msgpack";
import logger from "#lib/log/logger";

const commandOptionsRpc = {
  typeMapping: {
    [RESP_TYPES.BLOB_STRING]: Buffer,
  },
};
export default class CacheMananger {
  private static redisClient: RedisClient;

  public static async init(url: string) {
    this.redisClient = createClient({ url });

    await this.redisClient.connect();
    logger.scope("Cache").info("Successfully connected to cache server");
  }

  public static async remove(key: string) {
    await this.redisClient.del(key);
  }

  public static cacheRpc<T, A extends unknown[]>(
    key: string,
    fn: (...args: A) => Promise<T>
  ): (...args: A) => Promise<T> {
    return async (...args: A) => {
      const buffer: any = await this.redisClient
        .withCommandOptions(commandOptionsRpc)
        .get(key);

      if (buffer) {
        logger.scope("Cache").warn("Using cached RPC value");
        return new CacheRpc(buffer) as T;
      }

      const payload = await fn(...args);

      const bin = encode(payload);

      await this.redisClient.set(key, Buffer.from(bin));

      return payload;
    };
  }
}

export class CacheRpc {
  constructor(private buffer: Buffer<ArrayBufferLike>) {}

  public getPayload() {
    return this.buffer;
  }
}

/**
 * Types
 */

type RedisClient = ReturnType<typeof createClient>;
