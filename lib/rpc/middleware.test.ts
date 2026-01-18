/**
 * RPC Middleware Unit Tests
 *
 * Tests for the `createRpcMiddleware` factory function.
 * These tests validate the middleware logic in isolation using mocked dependencies.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { CONTENT_TYPES, HTTP_STATUS } from "./constants";

// ============================================================================
// Mocks
// ============================================================================

// Mock parseArgs to isolate middleware logic
vi.mock("./parseArgs", () => ({
    parseArgs: vi.fn().mockResolvedValue([]),
}));

// Mock error parser
vi.mock("./error", () => ({
    default: vi.fn((error) => ({
        name: error.name || "Error",
        message: error.message || "Unknown error",
        code: error.code,
    })),
}));

// Mock context module
vi.mock("#lib/context", () => ({
    runContext: vi.fn(async (context, callback) => {
        // Execute callback and return the result
        return await callback();
    }),
}));

// Import after mocks are set up
import { parseArgs } from "./parseArgs";
import {
    createRpcMiddleware,
    type ModuleMap,
    type PermissionValidator,
    type ServiceFunction,
} from "./middleware";

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Creates a mock Express request object.
 */
function createMockRequest(overrides: Partial<Request> = {}): Request {
    return {
        path: "/users/getById",
        headers: {
            accept: CONTENT_TYPES.MSGPACK,
        },
        body: Buffer.from([]),
        ...overrides,
    } as Request;
}

/**
 * Creates a mock Express response object with spies.
 */
function createMockResponse(): Response & {
    _mockSend: Mock;
    _mockSet: Mock;
    _mockStatus: Mock;
} {
    const res = {
        _mockSend: vi.fn(),
        _mockSet: vi.fn(),
        _mockStatus: vi.fn(),
        locals: {}, // Add locals object for authPayload
    };

    res._mockStatus.mockReturnValue({ send: res._mockSend });

    return {
        set: res._mockSet,
        status: res._mockStatus,
        send: res._mockSend,
        ...res,
    } as unknown as Response & typeof res;
}

/**
 * Creates a mock next function.
 */
function createMockNext(): NextFunction & Mock {
    return vi.fn() as NextFunction & Mock;
}

// ============================================================================
// Test Suite: createRpcMiddleware
// ============================================================================

describe("createRpcMiddleware", () => {
    let moduleMap: ModuleMap;
    let validatePermission: PermissionValidator & Mock;
    let mockHandler: ServiceFunction & Mock;

    beforeEach(() => {
        vi.clearAllMocks();

        moduleMap = new Map();
        validatePermission = vi.fn().mockResolvedValue(undefined);
        mockHandler = vi.fn().mockResolvedValue({ id: 1, name: "Test User" });

        moduleMap.set("/users/getById", mockHandler);

        // Reset parseArgs mock to return empty args by default
        (parseArgs as Mock).mockResolvedValue([]);
    });

    // ==========================================================================
    // Accept Header Validation
    // ==========================================================================

    describe("Accept header validation", () => {
        it("should call next() when Accept header is not msgpack", async () => {
            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest({
                headers: { accept: "application/json" },
            });
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it("should call next() when Accept header is missing", async () => {
            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest({
                headers: {},
            });
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it("should process request when Accept header is msgpack", async () => {
            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(mockHandler).toHaveBeenCalled();
        });
    });

    // ==========================================================================
    // Endpoint Resolution
    // ==========================================================================

    describe("Endpoint resolution", () => {
        it("should call next() when endpoint is not registered", async () => {
            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest({ path: "/unknown/endpoint" });
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it("should execute handler when endpoint is registered", async () => {
            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest({ path: "/users/getById" });
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(mockHandler).toHaveBeenCalled();
            expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        });

        it("should handle multiple registered endpoints correctly", async () => {
            const handler1 = vi.fn().mockResolvedValue({ type: "user" });
            const handler2 = vi.fn().mockResolvedValue({ type: "product" });

            moduleMap.set("/users/list", handler1);
            moduleMap.set("/products/list", handler2);

            const middleware = createRpcMiddleware({ moduleMap });

            // Request to users endpoint
            const req1 = createMockRequest({ path: "/users/list" });
            const res1 = createMockResponse();
            await middleware(req1, res1, createMockNext());

            expect(handler1).toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();

            // Reset and request to products endpoint
            handler1.mockClear();

            const req2 = createMockRequest({ path: "/products/list" });
            const res2 = createMockResponse();
            await middleware(req2, res2, createMockNext());

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });
    });

    // ==========================================================================
    // Permission Validation
    // ==========================================================================

    describe("Permission validation", () => {
        it("should not validate permissions when validator is not provided", async () => {
            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(mockHandler).toHaveBeenCalled();
            expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        });

        it("should call permission validator before executing handler", async () => {
            const callOrder: string[] = [];

            validatePermission.mockImplementation(async () => {
                callOrder.push("validate");
            });
            mockHandler.mockImplementation(async () => {
                callOrder.push("handler");
                return { success: true };
            });

            const middleware = createRpcMiddleware({ moduleMap, validatePermission });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(callOrder).toEqual(["validate", "handler"]);
        });

        it("should pass endpoint to permission validator", async () => {
            const middleware = createRpcMiddleware({ moduleMap, validatePermission });
            const req = createMockRequest({ path: "/users/getById" });
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(validatePermission).toHaveBeenCalledWith("/users/getById");
        });

        it("should return error when permission validation fails", async () => {
            const permissionError = { name: "ForbiddenError", message: "Access denied", code: "FORBIDDEN_ERROR" };
            validatePermission.mockRejectedValue(permissionError);

            const middleware = createRpcMiddleware({ moduleMap, validatePermission });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(mockHandler).not.toHaveBeenCalled();
            expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);
        });

        it("should not execute handler when permission is denied", async () => {
            validatePermission.mockRejectedValue(new Error("Forbidden"));

            const middleware = createRpcMiddleware({ moduleMap, validatePermission });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(mockHandler).not.toHaveBeenCalled();
        });
    });

    // ==========================================================================
    // Handler Execution
    // ==========================================================================

    describe("Handler execution", () => {
        it("should return success response when handler succeeds", async () => {
            mockHandler.mockResolvedValue({ success: true, data: [1, 2, 3] });

            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(res._mockSet).toHaveBeenCalledWith(
                "Content-Type",
                CONTENT_TYPES.MSGPACK
            );
            expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        });

        it("should return error response when handler throws", async () => {
            mockHandler.mockRejectedValue(new Error("Handler error"));

            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(res._mockSet).toHaveBeenCalledWith(
                "Content-Type",
                CONTENT_TYPES.MSGPACK
            );
            expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
        });

        it("should handle synchronous handlers", async () => {
            const syncHandler = vi.fn().mockReturnValue({ sync: true });
            moduleMap.set("/sync/endpoint", syncHandler);

            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest({ path: "/sync/endpoint" });
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(syncHandler).toHaveBeenCalled();
            expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        });

        it("should handle handlers returning undefined", async () => {
            mockHandler.mockResolvedValue(undefined);

            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        });

        it("should handle handlers returning null", async () => {
            mockHandler.mockResolvedValue(null);

            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
        });

        it("should pass parsed arguments to handler", async () => {
            const testArgs = [1, "test", { key: "value" }];
            (parseArgs as Mock).mockResolvedValue(testArgs);

            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(mockHandler).toHaveBeenCalledWith(1, "test", { key: "value" });
        });
    });

    // ==========================================================================
    // Edge Cases
    // ==========================================================================

    describe("Edge cases", () => {
        it("should handle empty module map", async () => {
            const emptyMap: ModuleMap = new Map();
            const middleware = createRpcMiddleware({ moduleMap: emptyMap });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it("should handle root endpoint path", async () => {
            const rootHandler = vi.fn().mockResolvedValue({ root: true });
            moduleMap.set("/", rootHandler);

            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest({ path: "/" });
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(rootHandler).toHaveBeenCalled();
        });

        it("should handle deeply nested endpoint paths", async () => {
            const nestedHandler = vi.fn().mockResolvedValue({ nested: true });
            moduleMap.set("/very/deeply/nested/endpoint/path", nestedHandler);

            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest({ path: "/very/deeply/nested/endpoint/path" });
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(nestedHandler).toHaveBeenCalled();
        });

        it("should be case-sensitive for endpoint matching", async () => {
            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest({ path: "/Users/GetById" }); // Different case
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(mockHandler).not.toHaveBeenCalled();
        });

        it("should handle parseArgs errors gracefully", async () => {
            (parseArgs as Mock).mockRejectedValue(new Error("Parse error"));

            const middleware = createRpcMiddleware({ moduleMap });
            const req = createMockRequest();
            const res = createMockResponse();
            const next = createMockNext();

            await middleware(req, res, next);

            expect(mockHandler).not.toHaveBeenCalled();
            expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.BAD_REQUEST);
        });
    });
});

// ============================================================================
// Test Suite: Integration with Mock Services
// ============================================================================

describe("createRpcMiddleware - Integration scenarios", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (parseArgs as Mock).mockResolvedValue([]);
    });

    it("should support typical CRUD operations pattern", async () => {
        const moduleMap: ModuleMap = new Map();

        const createUser = vi.fn().mockResolvedValue({ id: 1 });
        const getUser = vi.fn().mockResolvedValue({ id: 1, name: "Test" });
        const updateUser = vi.fn().mockResolvedValue({ id: 1, name: "Updated" });
        const deleteUser = vi.fn().mockResolvedValue({ success: true });

        moduleMap.set("/users/create", createUser);
        moduleMap.set("/users/getById", getUser);
        moduleMap.set("/users/update", updateUser);
        moduleMap.set("/users/delete", deleteUser);

        const middleware = createRpcMiddleware({ moduleMap });

        // Test create
        const createReq = createMockRequest({ path: "/users/create" });
        await middleware(createReq, createMockResponse(), createMockNext());
        expect(createUser).toHaveBeenCalled();

        // Test get
        const getReq = createMockRequest({ path: "/users/getById" });
        await middleware(getReq, createMockResponse(), createMockNext());
        expect(getUser).toHaveBeenCalled();

        // Test update
        const updateReq = createMockRequest({ path: "/users/update" });
        await middleware(updateReq, createMockResponse(), createMockNext());
        expect(updateUser).toHaveBeenCalled();

        // Test delete
        const deleteReq = createMockRequest({ path: "/users/delete" });
        await middleware(deleteReq, createMockResponse(), createMockNext());
        expect(deleteUser).toHaveBeenCalled();
    });

    it("should support different modules with same function names", async () => {
        const moduleMap: ModuleMap = new Map();

        const usersList = vi.fn().mockResolvedValue({ type: "users" });
        const productsList = vi.fn().mockResolvedValue({ type: "products" });

        moduleMap.set("/users/list", usersList);
        moduleMap.set("/products/list", productsList);

        const middleware = createRpcMiddleware({ moduleMap });

        const usersReq = createMockRequest({ path: "/users/list" });
        await middleware(usersReq, createMockResponse(), createMockNext());
        expect(usersList).toHaveBeenCalled();
        expect(productsList).not.toHaveBeenCalled();
    });

    it("should support role-based access with custom validator", async () => {
        const moduleMap: ModuleMap = new Map();
        const adminHandler = vi.fn().mockResolvedValue({ admin: true });
        moduleMap.set("/admin/dashboard", adminHandler);

        let currentUserRole = "user";

        const roleValidator: PermissionValidator = async (endpoint) => {
            if (endpoint.startsWith("/admin") && currentUserRole !== "admin") {
                const error: any = new Error("Admin access required");
                error.code = "FORBIDDEN_ERROR";
                error.name = "ForbiddenError";
                throw error;
            }
        };

        const middleware = createRpcMiddleware({
            moduleMap,
            validatePermission: roleValidator,
        });

        // Non-admin user tries to access admin endpoint
        const req = createMockRequest({ path: "/admin/dashboard" });
        const res = createMockResponse();
        await middleware(req, res, createMockNext());

        expect(adminHandler).not.toHaveBeenCalled();
        expect(res._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.UNAUTHORIZED);

        // Admin user accesses admin endpoint
        currentUserRole = "admin";
        const adminReq = createMockRequest({ path: "/admin/dashboard" });
        const adminRes = createMockResponse();
        await middleware(adminReq, adminRes, createMockNext());

        expect(adminHandler).toHaveBeenCalled();
        expect(adminRes._mockStatus).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });
});
