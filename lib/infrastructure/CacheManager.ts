import crypto from "node:crypto";
import { createClient, RESP_TYPES, type RedisClientType } from "redis";
import { encode, decode } from "#shared/msgpackr";
import logger from "../log/logger";

type CacheKeyBuilder<A extends unknown[]> = (args: A) => string;

export interface CacheOptions<T, A extends unknown[]> {
  /** TTL en segundos (EX). Si no se define, queda persistente. */
  ttlSeconds?: number;

  /**
   * Construye el key a partir de los args.
   * Si no se provee, se usa un default razonable.
   */
  keyBuilder?: CacheKeyBuilder<A>;

  /** Serializador (default: msgpack encode -> Buffer) */
  serialize?: (value: T) => Buffer;

  /** Deserializador (default: msgpack decode) */
  deserialize?: (buf: Buffer) => T;

  /** Si true, loggea cache hits (default: false) */
  logHits?: boolean;
}

const rpcCommandOptions = {
  typeMapping: {
    [RESP_TYPES.BLOB_STRING]: Buffer,
  },
} as const;

function defaultKeyFromArgs<A extends unknown[]>(
  baseKey: string,
  args: A,
): string {
  const suffix = args.length ? `:${JSON.stringify(args)}` : "";
  const key = `${baseKey}${suffix}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return hash;
}

export class CacheManager {
  private client: RedisClientType;
  private isReady = false;
  private connectPromise: Promise<void> | null = null;

  private constructor(url: string) {
    this.client = createClient({
      url,
      // Si quieres, agrega socket config/reconnectStrategy aquí
      // socket: { reconnectStrategy: (retries) => Math.min(retries * 50, 2000) },
    });

    const log = logger.scope("Cache");

    this.client.on("error", (err) => log.error(`Redis client error: ${err}`));
    this.client.on("connect", () => log.info("Redis connecting..."));
    this.client.on("ready", () => {
      this.isReady = true;
      log.info("Redis ready");
    });
    this.client.on("end", () => {
      this.isReady = false;
      log.warn("Redis connection closed");
    });
    // node-redis emits 'reconnecting' in some versions/configs
    this.client.on("reconnecting", () => log.warn("Redis reconnecting..."));
  }

  /** Singleton */
  private static instance: CacheManager | null = null;

  /**
   * Inicializa (idempotente). Puedes llamarlo en bootstrap.
   */
  public static init(url: string): CacheManager {
    if (!this.instance) {
      this.instance = new CacheManager(url);
    }
    return this.instance;
  }

  /** Obtén la instancia ya inicializada */
  public static get(): CacheManager {
    if (!this.instance) {
      throw new Error(
        "CacheManager not initialized. Call CacheManager.init(url) first.",
      );
    }
    return this.instance;
  }

  /**
   * Conecta (idempotente). Si ya está conectando o conectado, no duplica.
   */
  public async connect(): Promise<void> {
    if (this.isReady) return;

    if (!this.connectPromise) {
      this.connectPromise = this.client
        .connect()
        .then(() => {
          logger.scope("Cache").info("Successfully connected to cache server");
        })
        .finally(() => {
          // Si falla, deja connectPromise en null para permitir reintentos manuales
          if (!this.isReady) this.connectPromise = null;
        });
    }

    await this.connectPromise;
  }

  public async disconnect(): Promise<void> {
    this.connectPromise = null;
    await this.client.quit();
  }

  public async remove(key: string): Promise<number> {
    return this.client.del(key);
  }

  public async getBuffer(key: string): Promise<Buffer | null> {
    const buf = (await this.client
      .withCommandOptions(rpcCommandOptions)
      .get(key)) as Buffer | null;
    return buf ?? null;
  }

  public async setBuffer(
    key: string,
    value: Buffer,
    ttlSeconds?: number,
  ): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, value, { EX: ttlSeconds });
      return;
    }
    await this.client.set(key, value);
  }

  /**
   * Atomically increment a counter. Returns new value.
   * If key doesn't exist, it's created with value 1.
   */
  public async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  /**
   * Atomically decrement a counter. Returns new value.
   * If key doesn't exist, it's created with value -1.
   * Use with caution - can go negative.
   */
  public async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  /**
   * Get a numeric value from cache. Returns 0 if key doesn't exist.
   */
  public async getNumber(key: string): Promise<number> {
    const value = await this.client.get(key);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Wrapper estándar: cachea y retorna el valor ya deserializado (T).
   */
  public static cacheFn<T, A extends unknown[]>(
    baseKey: string,
    fn: (...args: A) => Promise<T>,
    options: CacheOptions<T, A> = {},
  ): (...args: A) => Promise<T> {
    const cache = this.get();

    return cache.cache(baseKey, fn, options);
  }

  /**
   * Wrapper estándar: cachea y retorna el valor ya deserializado (T).
   */
  public cache<T, A extends unknown[]>(
    baseKey: string,
    fn: (...args: A) => Promise<T>,
    options: CacheOptions<T, A> = {},
  ): (...args: A) => Promise<T> {
    const {
      ttlSeconds,
      keyBuilder,
      serialize = (v: T) => Buffer.from(encode(v)),
      deserialize = (b: Buffer) => decode(b) as T,
      logHits = false,
    } = options;

    return async (...args: A) => {
      const key = keyBuilder
        ? keyBuilder(args)
        : defaultKeyFromArgs(baseKey, args);

      const buf = await this.getBuffer(key);
      if (buf) {
        if (logHits) logger.scope("Cache").debug(`Cache hit: ${key}`);
        return deserialize(buf);
      }

      const payload = await fn(...args);
      const bin = serialize(payload);

      await this.setBuffer(key, bin, ttlSeconds);
      return payload;
    };
  }

  /**
   * Variante RPC/stream-friendly: cachea y retorna Buffer (msgpack) directamente.
   * Útil si tu endpoint literalmente “habla msgpack” y no quieres decode/encode doble.
   */
  public cacheBuffer<A extends unknown[]>(
    baseKey: string,
    fn: (...args: A) => Promise<Buffer>,
    options: Omit<CacheOptions<Buffer, A>, "serialize" | "deserialize"> = {},
  ): (...args: A) => Promise<Buffer> {
    const { ttlSeconds, keyBuilder, logHits = false } = options;

    return async (...args: A) => {
      const key = keyBuilder
        ? keyBuilder(args)
        : defaultKeyFromArgs(baseKey, args);

      const buf = await this.getBuffer(key);
      if (buf) {
        if (logHits) logger.scope("Cache").debug(`Cache hit: ${key}`);
        return buf;
      }

      const payloadBuf = await fn(...args);
      await this.setBuffer(key, payloadBuf, ttlSeconds);
      return payloadBuf;
    };
  }
}
