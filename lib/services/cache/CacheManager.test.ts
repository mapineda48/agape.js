import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CacheManager, type CacheOptions } from "./CacheManager";
import { encode, decode } from "../../utils/msgpack";

// Mock redis client
const mockRedisClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    quit: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(1),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    on: vi.fn(),
    withCommandOptions: vi.fn().mockReturnThis(),
};

// Mock createClient
vi.mock("redis", () => ({
    createClient: vi.fn(() => mockRedisClient),
    RESP_TYPES: {
        BLOB_STRING: 0,
    },
}));

// Mock logger
vi.mock("../../log/logger", () => ({
    default: {
        scope: vi.fn(() => ({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        })),
    },
}));

describe("lib/services/cache/CacheManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton instance for each test
        // @ts-expect-error - accessing private static for testing
        CacheManager.instance = null;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("Singleton pattern", () => {
        it("should create a new instance with init()", () => {
            const instance = CacheManager.init("redis://localhost:6379");
            expect(instance).toBeDefined();
            expect(instance).toBeInstanceOf(CacheManager);
        });

        it("should return the same instance on multiple init() calls", () => {
            const instance1 = CacheManager.init("redis://localhost:6379");
            const instance2 = CacheManager.init("redis://localhost:6379");
            expect(instance1).toBe(instance2);
        });

        it("should return the instance with get() after init()", () => {
            const initInstance = CacheManager.init("redis://localhost:6379");
            const getInstance = CacheManager.get();
            expect(initInstance).toBe(getInstance);
        });

        it("should throw error when calling get() before init()", () => {
            expect(() => CacheManager.get()).toThrow(
                "CacheManager not initialized. Call CacheManager.init(url) first."
            );
        });
    });

    describe("connect()", () => {
        it("should connect to Redis", async () => {
            const instance = CacheManager.init("redis://localhost:6379");
            await instance.connect();
            expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
        });

        it("should not duplicate connection if already connecting", async () => {
            const instance = CacheManager.init("redis://localhost:6379");

            // Start two connections simultaneously
            const promise1 = instance.connect();
            const promise2 = instance.connect();

            await Promise.all([promise1, promise2]);

            expect(mockRedisClient.connect).toHaveBeenCalledTimes(1);
        });

        it("should not connect if already ready", async () => {
            const instance = CacheManager.init("redis://localhost:6379");

            // Simulate ready state by triggering the 'ready' event handler
            const readyHandler = mockRedisClient.on.mock.calls.find(
                (call: unknown[]) => call[0] === "ready"
            )?.[1];
            if (readyHandler) readyHandler();

            await instance.connect();

            expect(mockRedisClient.connect).not.toHaveBeenCalled();
        });
    });

    describe("disconnect()", () => {
        it("should disconnect from Redis", async () => {
            const instance = CacheManager.init("redis://localhost:6379");
            await instance.disconnect();
            expect(mockRedisClient.quit).toHaveBeenCalledTimes(1);
        });
    });

    describe("remove()", () => {
        it("should delete a key from Redis", async () => {
            const instance = CacheManager.init("redis://localhost:6379");
            const result = await instance.remove("test-key");
            expect(mockRedisClient.del).toHaveBeenCalledWith("test-key");
            expect(result).toBe(1);
        });
    });

    describe("getBuffer()", () => {
        it("should return null when key does not exist", async () => {
            mockRedisClient.get.mockResolvedValueOnce(null);
            const instance = CacheManager.init("redis://localhost:6379");
            const result = await instance.getBuffer("nonexistent-key");
            expect(result).toBeNull();
        });

        it("should return buffer when key exists", async () => {
            const testBuffer = Buffer.from("test-data");
            mockRedisClient.get.mockResolvedValueOnce(testBuffer);

            const instance = CacheManager.init("redis://localhost:6379");
            const result = await instance.getBuffer("existing-key");

            expect(result).toEqual(testBuffer);
        });
    });

    describe("setBuffer()", () => {
        it("should set a buffer without TTL", async () => {
            const instance = CacheManager.init("redis://localhost:6379");
            const testBuffer = Buffer.from("test-data");

            await instance.setBuffer("test-key", testBuffer);

            expect(mockRedisClient.set).toHaveBeenCalledWith("test-key", testBuffer);
        });

        it("should set a buffer with TTL", async () => {
            const instance = CacheManager.init("redis://localhost:6379");
            const testBuffer = Buffer.from("test-data");

            await instance.setBuffer("test-key", testBuffer, 300);

            expect(mockRedisClient.set).toHaveBeenCalledWith("test-key", testBuffer, {
                EX: 300,
            });
        });

        it("should not use TTL when ttlSeconds is 0", async () => {
            const instance = CacheManager.init("redis://localhost:6379");
            const testBuffer = Buffer.from("test-data");

            await instance.setBuffer("test-key", testBuffer, 0);

            expect(mockRedisClient.set).toHaveBeenCalledWith("test-key", testBuffer);
        });
    });

    describe("cache()", () => {
        it("should call the wrapped function on cache miss", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue({ data: "result" });

            const cachedFn = instance.cache("test-key", mockFn);
            const result = await cachedFn();

            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ data: "result" });
        });

        it("should return cached value on cache hit", async () => {
            const cachedData = { data: "cached-result" };
            const cachedBuffer = Buffer.from(encode(cachedData));
            mockRedisClient.get.mockResolvedValue(cachedBuffer);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue({ data: "fresh-result" });

            const cachedFn = instance.cache("test-key", mockFn);
            const result = await cachedFn();

            expect(mockFn).not.toHaveBeenCalled();
            expect(result).toEqual(cachedData);
        });

        it("should store value in cache after function call", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue({ data: "result" });

            const cachedFn = instance.cache("test-key", mockFn);
            await cachedFn();

            expect(mockRedisClient.set).toHaveBeenCalledTimes(1);
        });

        it("should use custom keyBuilder when provided", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue("result");
            const keyBuilder = (args: [string, number]) =>
                `custom:${args[0]}:${args[1]}`;

            const cachedFn = instance.cache<string, [string, number]>(
                "base",
                mockFn,
                { keyBuilder }
            );
            await cachedFn("foo", 42);

            expect(mockRedisClient.withCommandOptions).toHaveBeenCalled();
            // The key should be built using keyBuilder
            expect(mockRedisClient.get).toHaveBeenCalled();
        });

        it("should use TTL when provided", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue("result");

            const cachedFn = instance.cache("test-key", mockFn, { ttlSeconds: 600 });
            await cachedFn();

            expect(mockRedisClient.set).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Buffer),
                { EX: 600 }
            );
        });

        it("should use custom serialize and deserialize functions", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue("test-value");
            const serialize = vi.fn((v: string) => Buffer.from(v));
            const deserialize = vi.fn((b: Buffer) => b.toString());

            const cachedFn = instance.cache("test-key", mockFn, {
                serialize,
                deserialize,
            });
            await cachedFn();

            expect(serialize).toHaveBeenCalledWith("test-value");
        });

        it("should build default key from args", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue("result");

            const cachedFn = instance.cache<string, [string, number]>(
                "mykey",
                mockFn
            );
            await cachedFn("arg1", 123);

            // Default key format: baseKey:JSON.stringify(args)
            expect(mockRedisClient.get).toHaveBeenCalled();
        });

        it("should not include suffix when no args provided", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue("result");

            const cachedFn = instance.cache<string, []>("mykey", mockFn);
            await cachedFn();

            expect(mockRedisClient.get).toHaveBeenCalled();
        });
    });

    describe("cacheBuffer()", () => {
        it("should call the wrapped function on cache miss", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const resultBuffer = Buffer.from("result-buffer");
            const mockFn = vi.fn().mockResolvedValue(resultBuffer);

            const cachedFn = instance.cacheBuffer("test-key", mockFn);
            const result = await cachedFn();

            expect(mockFn).toHaveBeenCalledTimes(1);
            expect(result).toEqual(resultBuffer);
        });

        it("should return cached buffer on cache hit", async () => {
            const cachedBuffer = Buffer.from("cached-buffer");
            mockRedisClient.get.mockResolvedValue(cachedBuffer);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue(Buffer.from("fresh-buffer"));

            const cachedFn = instance.cacheBuffer("test-key", mockFn);
            const result = await cachedFn();

            expect(mockFn).not.toHaveBeenCalled();
            expect(result).toEqual(cachedBuffer);
        });

        it("should store buffer in cache after function call", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const resultBuffer = Buffer.from("result-buffer");
            const mockFn = vi.fn().mockResolvedValue(resultBuffer);

            const cachedFn = instance.cacheBuffer("test-key", mockFn);
            await cachedFn();

            expect(mockRedisClient.set).toHaveBeenCalledTimes(1);
        });

        it("should use TTL when provided", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue(Buffer.from("data"));

            const cachedFn = instance.cacheBuffer("test-key", mockFn, {
                ttlSeconds: 300,
            });
            await cachedFn();

            expect(mockRedisClient.set).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(Buffer),
                { EX: 300 }
            );
        });

        it("should use custom keyBuilder when provided", async () => {
            mockRedisClient.get.mockResolvedValue(null);

            const instance = CacheManager.init("redis://localhost:6379");
            const mockFn = vi.fn().mockResolvedValue(Buffer.from("data"));
            const keyBuilder = (args: [string]) => `buffer:${args[0]}`;

            const cachedFn = instance.cacheBuffer<[string]>("base", mockFn, {
                keyBuilder,
            });
            await cachedFn("test");

            expect(mockRedisClient.get).toHaveBeenCalled();
        });
    });

    describe("Event handlers", () => {
        it("should register event handlers on client", () => {
            CacheManager.init("redis://localhost:6379");

            const registeredEvents = mockRedisClient.on.mock.calls.map(
                (call: unknown[]) => call[0]
            );

            expect(registeredEvents).toContain("error");
            expect(registeredEvents).toContain("connect");
            expect(registeredEvents).toContain("ready");
            expect(registeredEvents).toContain("end");
            expect(registeredEvents).toContain("reconnecting");
        });

        it("should set isReady to true on ready event", () => {
            const instance = CacheManager.init("redis://localhost:6379");

            const readyHandler = mockRedisClient.on.mock.calls.find(
                (call: unknown[]) => call[0] === "ready"
            )?.[1];

            expect(readyHandler).toBeDefined();

            // Trigger ready event
            readyHandler?.();

            // isReady should be true (tested via connect() not being called)
            mockRedisClient.connect.mockClear();
            // @ts-expect-error - accessing private property for testing
            expect(instance.isReady).toBe(true);
        });

        it("should set isReady to false on end event", () => {
            const instance = CacheManager.init("redis://localhost:6379");

            // First set to ready
            const readyHandler = mockRedisClient.on.mock.calls.find(
                (call: unknown[]) => call[0] === "ready"
            )?.[1];
            readyHandler?.();

            // Then trigger end
            const endHandler = mockRedisClient.on.mock.calls.find(
                (call: unknown[]) => call[0] === "end"
            )?.[1];
            endHandler?.();

            // @ts-expect-error - accessing private property for testing
            expect(instance.isReady).toBe(false);
        });
    });
});
