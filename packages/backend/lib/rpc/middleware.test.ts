import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import type { ModuleMap, PermissionValidator } from "./middleware.ts";

// Mock the modules that trigger side effects before importing createRpcMiddleware
vi.mock("./path.ts", () => ({
  cwd: "/fake/services",
  findServices: vi.fn(() => ({
    async *[Symbol.asyncIterator]() {
      // yield nothing - empty service discovery
    },
  })),
  toPublicUrl: vi.fn(),
  getEndpointPath: vi.fn(),
}));

vi.mock("./rbac/authorization.ts", () => ({
  validateEndpointPermission: vi.fn(),
}));

// Mock shared/msgpackr to avoid loading extensions that may not be available
vi.mock("#shared/msgpackr", () => ({
  encode: vi.fn((val: unknown) => Buffer.from(JSON.stringify(val))),
  decode: vi.fn((buf: Buffer) => JSON.parse(buf.toString())),
}));

// Mock the context module
vi.mock("#lib/context", () => {
  let currentCtx: unknown = null;
  return {
    runContext: vi.fn((_ctx: unknown, cb: () => unknown) => {
      currentCtx = _ctx;
      try {
        return cb();
      } finally {
        currentCtx = null;
      }
    }),
    getStore: vi.fn(() => currentCtx),
  };
});

// Mock shared/rpc
vi.mock("#shared/rpc", () => ({
  CONTENT_TYPES: {
    MSGPACK: "application/msgpack",
    MULTIPART: "multipart/form-data",
  },
}));

// Mock logger
vi.mock("#lib/log/logger", () => ({
  default: {
    scope: () => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

// Mock args decoder
vi.mock("./args.ts", () => ({
  decodeArgs: vi.fn(async () => []),
}));

// Now we can safely import createRpcMiddleware (the module-level `await createModuleMap()` is avoided by mocking path.ts)
const { createRpcMiddleware } = await import("./middleware.ts");
const { decodeArgs } = await import("./args.ts");

// ============================================================================
// Test Helpers
// ============================================================================

function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {
      accept: "application/msgpack",
      "content-type": "multipart/form-data; boundary=---abc",
    },
    path: "/users/getById",
    ...overrides,
  } as unknown as Request;
}

function createMockResponse(): Response & {
  _status: number;
  _headers: Record<string, string>;
  _body: unknown;
} {
  const res = {
    _status: 200,
    _headers: {} as Record<string, string>,
    _body: undefined as unknown,
    locals: {},
    set(key: string, value: string) {
      res._headers[key] = value;
      return res;
    },
    status(code: number) {
      res._status = code;
      return res;
    },
    send(body: unknown) {
      res._body = body;
      return res;
    },
  };
  return res as unknown as Response & {
    _status: number;
    _headers: Record<string, string>;
    _body: unknown;
  };
}

function createNext(): NextFunction & { called: boolean } {
  const fn = vi.fn() as unknown as NextFunction & { called: boolean };
  Object.defineProperty(fn, "called", {
    get: () => (fn as unknown as ReturnType<typeof vi.fn>).mock.calls.length > 0,
  });
  return fn;
}

// ============================================================================
// Tests
// ============================================================================

describe("rpc/middleware - createRpcMiddleware", () => {
  let moduleMap: ModuleMap;
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = vi.fn().mockResolvedValue({ ok: true });
    moduleMap = new Map([["/users/getById", handler]]);
  });

  it("calls next() for non-msgpack requests", async () => {
    const middleware = createRpcMiddleware({ moduleMap });
    const req = createMockRequest({
      headers: { accept: "application/json", "content-type": "multipart/form-data" },
    } as Partial<Request>);
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(next.called).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls next() for non-multipart requests", async () => {
    const middleware = createRpcMiddleware({ moduleMap });
    const req = createMockRequest({
      headers: { accept: "application/msgpack", "content-type": "application/json" },
    } as Partial<Request>);
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(next.called).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls next() for unknown endpoints", async () => {
    const middleware = createRpcMiddleware({ moduleMap });
    const req = createMockRequest({ path: "/unknown/endpoint" });
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(next.called).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler for known endpoints", async () => {
    const middleware = createRpcMiddleware({ moduleMap });
    vi.mocked(decodeArgs).mockResolvedValue([1, "test"]);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(next.called).toBe(false);
    expect(handler).toHaveBeenCalledWith(1, "test");
  });

  it("sets correct content-type on success response", async () => {
    const middleware = createRpcMiddleware({ moduleMap });
    vi.mocked(decodeArgs).mockResolvedValue([]);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(res._headers["Content-Type"]).toBe("application/msgpack");
    expect(res._status).toBe(200);
  });

  it("handles handler errors with 400 status code", async () => {
    handler.mockRejectedValue(new Error("Something failed"));
    const middleware = createRpcMiddleware({ moduleMap });
    vi.mocked(decodeArgs).mockResolvedValue([]);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(res._status).toBe(400);
    expect(res._headers["Content-Type"]).toBe("application/msgpack");
  });

  it("returns 401 for UnauthorizedError", async () => {
    const err = new Error("Not authenticated");
    (err as unknown as Record<string, string>).code = "UNAUTHORIZED_ERROR";
    handler.mockRejectedValue(err);
    const middleware = createRpcMiddleware({ moduleMap });
    vi.mocked(decodeArgs).mockResolvedValue([]);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(res._status).toBe(401);
  });

  it("returns 403 for ForbiddenError", async () => {
    const err = new Error("Access denied");
    (err as unknown as Record<string, string>).code = "FORBIDDEN_ERROR";
    handler.mockRejectedValue(err);
    const middleware = createRpcMiddleware({ moduleMap });
    vi.mocked(decodeArgs).mockResolvedValue([]);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(res._status).toBe(403);
  });

  it("calls permission validator when provided", async () => {
    const permissionValidator: PermissionValidator = vi.fn();
    const middleware = createRpcMiddleware({ moduleMap, permissionValidator });
    vi.mocked(decodeArgs).mockResolvedValue([]);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(permissionValidator).toHaveBeenCalledWith("/users/getById");
    expect(res._status).toBe(200);
  });

  it("permission validator rejection returns 403", async () => {
    const err = new Error("Forbidden");
    (err as unknown as Record<string, string>).code = "FORBIDDEN_ERROR";
    const permissionValidator: PermissionValidator = vi.fn().mockRejectedValue(err);
    const middleware = createRpcMiddleware({ moduleMap, permissionValidator });
    vi.mocked(decodeArgs).mockResolvedValue([]);

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createNext();

    await middleware(req, res, next);

    expect(permissionValidator).toHaveBeenCalledWith("/users/getById");
    expect(res._status).toBe(403);
  });

  it("uses auth payload from res.locals when available", async () => {
    const { runContext } = await import("#lib/context");
    const middleware = createRpcMiddleware({ moduleMap });
    vi.mocked(decodeArgs).mockResolvedValue([]);

    const req = createMockRequest();
    const res = createMockResponse();
    (res as unknown as Response).locals = {
      authPayload: { id: 5, tenant: "acme", permissions: ["read"] },
    };
    const next = createNext();

    await middleware(req, res as unknown as Response, next);

    expect(runContext).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5, tenant: "acme", permissions: ["read"], source: "http" }),
      expect.any(Function),
    );
  });
});
