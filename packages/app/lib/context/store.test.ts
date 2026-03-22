import { describe, it, expect } from "vitest";
import { runContext, getStore, getStoreOrNull, hasContext } from "./store.js";
import type { IContext } from "./types.js";

function createContext(overrides: Partial<IContext> = {}): IContext {
  return {
    id: 1,
    tenant: "default",
    permissions: ["admin"],
    session: new Map(),
    source: "http",
    ...overrides,
  };
}

describe("context/store", () => {
  describe("runContext", () => {
    it("makes context available inside the callback", () => {
      const ctx = createContext({ id: 42, tenant: "acme" });

      runContext(ctx, () => {
        const store = getStore();
        expect(store.id).toBe(42);
        expect(store.tenant).toBe("acme");
        expect(store.permissions).toEqual(["admin"]);
        expect(store.source).toBe("http");
      });
    });

    it("returns the callback result (sync)", () => {
      const ctx = createContext();
      const result = runContext(ctx, () => "hello");
      expect(result).toBe("hello");
    });

    it("returns the callback result (async)", async () => {
      const ctx = createContext();
      const result = await runContext(ctx, async () => "async-hello");
      expect(result).toBe("async-hello");
    });

    it("always creates a fresh session Map", () => {
      const existingSession = new Map([["key", "value"]]);
      const ctx = createContext({ session: existingSession });

      runContext(ctx, () => {
        const store = getStore();
        // session should be a new empty Map, not the one we passed in
        expect(store.session.size).toBe(0);
        expect(store.session).not.toBe(existingSession);
      });
    });
  });

  describe("getStore", () => {
    it("throws outside of runContext", () => {
      expect(() => getStore()).toThrow();
    });

    it("returns the context inside runContext", () => {
      const ctx = createContext({ id: 99 });
      runContext(ctx, () => {
        expect(getStore().id).toBe(99);
      });
    });
  });

  describe("getStoreOrNull", () => {
    it("returns null outside of runContext", () => {
      expect(getStoreOrNull()).toBeNull();
    });

    it("returns the context inside runContext", () => {
      const ctx = createContext({ id: 7 });
      runContext(ctx, () => {
        const store = getStoreOrNull();
        expect(store).not.toBeNull();
        expect(store!.id).toBe(7);
      });
    });
  });

  describe("hasContext", () => {
    it("returns false outside of runContext", () => {
      expect(hasContext()).toBe(false);
    });

    it("returns true inside runContext", () => {
      const ctx = createContext();
      runContext(ctx, () => {
        expect(hasContext()).toBe(true);
      });
    });
  });

  describe("nested contexts", () => {
    it("inner context overrides outer context", () => {
      const outer = createContext({ id: 1 });
      const inner = createContext({ id: 2 });

      runContext(outer, () => {
        expect(getStore().id).toBe(1);

        runContext(inner, () => {
          expect(getStore().id).toBe(2);
        });

        // After inner runContext completes, outer context is restored
        expect(getStore().id).toBe(1);
      });
    });
  });

  describe("context isolation between concurrent calls", () => {
    it("concurrent async contexts are isolated", async () => {
      const results: number[] = [];

      const task1 = runContext(createContext({ id: 100 }), async () => {
        await new Promise((r) => setTimeout(r, 10));
        results.push(getStore().id);
      });

      const task2 = runContext(createContext({ id: 200 }), async () => {
        results.push(getStore().id);
      });

      await Promise.all([task1, task2]);

      // task2 runs first (no delay), task1 runs second (10ms delay)
      expect(results).toContain(100);
      expect(results).toContain(200);
      expect(results).toHaveLength(2);
    });
  });
});
