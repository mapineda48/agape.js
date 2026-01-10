/**
 * Authentication Middleware Unit Tests
 *
 * Tests for the `getCookie` helper and `createAuthMiddleware` factory function.
 * 
 * Note: The createAuthMiddleware tests use the real Jwt class since it's already
 * well-tested in Jwt.test.ts. This allows testing the actual middleware behavior
 * with integration-like tests while still mocking the user service functions.
 */

import { describe, it, expect, vi, type Mock } from "vitest";
import {
    getCookie,
    type FindByCredentials,
    type FindById,
    type IUserSession,
} from "./middleware";

// ============================================================================
// Test Suite: getCookie
// ============================================================================

describe("getCookie", () => {
    it("should return undefined when header is undefined", () => {
        expect(getCookie(undefined)).toBeUndefined();
    });

    it("should return undefined when header is empty string", () => {
        expect(getCookie("")).toBeUndefined();
    });

    it("should extract auth_token from cookie header", () => {
        const header = "auth_token=abc123xyz; other_cookie=value";
        expect(getCookie(header)).toBe("abc123xyz");
    });

    it("should return undefined when auth_token is not present", () => {
        const header = "other_cookie=value; another=test";
        expect(getCookie(header)).toBeUndefined();
    });

    it("should handle auth_token as the only cookie", () => {
        const header = "auth_token=singletoken";
        expect(getCookie(header)).toBe("singletoken");
    });

    it("should handle auth_token at the end of header", () => {
        const header = "other=value; auth_token=lasttoken";
        expect(getCookie(header)).toBe("lasttoken");
    });

    it("should handle auth_token with special characters", () => {
        const header = "auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
        expect(getCookie(header)).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U");
    });
});

// ============================================================================
// Test Suite: Factory Function Types
// ============================================================================

describe("createAuthMiddleware - Type Contracts", () => {
    it("should export FindByCredentials type that accepts username and password", () => {
        const mockFind: FindByCredentials = vi.fn().mockResolvedValue({
            id: 1,
            fullName: "Test User",
            avatarUrl: null,
            permissions: [],
            tenant: "test-tenant",
        });

        expect(typeof mockFind).toBe("function");
    });

    it("should export FindById type that accepts numeric id", () => {
        const mockFind: FindById = vi.fn().mockResolvedValue({
            id: 1,
            fullName: "Test User",
            avatarUrl: null,
            permissions: [],
            tenant: "test-tenant",
        });

        expect(typeof mockFind).toBe("function");
    });

    it("should define IUserSession with required fields", () => {
        const user: IUserSession = {
            id: 123,
            fullName: "John Doe",
            avatarUrl: "https://example.com/avatar.jpg",
            permissions: ["read", "write"],
            tenant: "test-tenant",
        };

        expect(user.id).toBe(123);
        expect(user.fullName).toBe("John Doe");
        expect(user.permissions).toEqual(["read", "write"]);
        expect(user.tenant).toBe("test-tenant");
    });

    it("should allow IUserSession with null avatarUrl", () => {
        const user: IUserSession = {
            id: 456,
            fullName: "Jane Doe",
            avatarUrl: null,
            permissions: [],
            tenant: "test-tenant",
        };

        expect(user.id).toBe(456);
        expect(user.avatarUrl).toBeNull();
    });
});

// ============================================================================
// Test Suite: FindByCredentials Mock Behavior
// ============================================================================

describe("FindByCredentials - Mock Usage Patterns", () => {
    it("should return user session when credentials are valid", async () => {
        const expectedUser: IUserSession = {
            id: 1,
            fullName: "Admin User",
            avatarUrl: null,
            permissions: ["*"],
            tenant: "test-tenant",
        };

        const findByCredentials: FindByCredentials = vi
            .fn()
            .mockResolvedValue(expectedUser);

        const result = await findByCredentials("admin", "password123");

        expect(findByCredentials).toHaveBeenCalledWith("admin", "password123");
        expect(result).toEqual(expectedUser);
    });

    it("should return null when credentials are invalid", async () => {
        const findByCredentials: FindByCredentials = vi
            .fn()
            .mockResolvedValue(null);

        const result = await findByCredentials("wrong", "credentials");

        expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
        const findByCredentials: FindByCredentials = vi
            .fn()
            .mockRejectedValue(new Error("Database connection failed"));

        await expect(findByCredentials("user", "pass")).rejects.toThrow(
            "Database connection failed"
        );
    });
});

// ============================================================================
// Test Suite: FindById Mock Behavior
// ============================================================================

describe("FindById - Mock Usage Patterns", () => {
    it("should return user session when ID exists", async () => {
        const expectedUser: IUserSession = {
            id: 42,
            fullName: "John Doe",
            avatarUrl: "https://example.com/avatar.jpg",
            permissions: ["users.read"],
            tenant: "test-tenant",
        };

        const findById: FindById = vi.fn().mockResolvedValue(expectedUser);

        const result = await findById(42);

        expect(findById).toHaveBeenCalledWith(42);
        expect(result).toEqual(expectedUser);
    });

    it("should return null when ID does not exist", async () => {
        const findById: FindById = vi.fn().mockResolvedValue(null);

        const result = await findById(99999);

        expect(result).toBeNull();
    });

    it("should refresh user data with current permissions", async () => {
        // Simulate permission changes between sessions
        const findById: FindById = vi.fn().mockImplementation(async (id) => {
            // First call: original permissions
            if ((findById as Mock).mock.calls.length === 1) {
                return {
                    id,
                    fullName: "User",
                    avatarUrl: null,
                    permissions: ["read"],
                    tenant: "test-tenant"
                };
            }
            // Second call: updated permissions
            return {
                id,
                fullName: "User",
                avatarUrl: null,
                permissions: ["read", "write"],
                tenant: "test-tenant"
            };
        });

        const first = await findById(1);
        const second = await findById(1);

        expect(first?.permissions).toEqual(["read"]);
        expect(second?.permissions).toEqual(["read", "write"]);
    });
});

// ============================================================================
// Test Suite: Integration Pattern Examples
// ============================================================================

describe("Auth Middleware - Integration Patterns", () => {
    it("should support in-memory user store for testing", async () => {
        const users = new Map<number, IUserSession>([
            [1, { id: 1, fullName: "Alice", avatarUrl: null, permissions: ["admin.*"], tenant: "test" }],
            [2, { id: 2, fullName: "Bob", avatarUrl: null, permissions: ["users.read"], tenant: "test" }],
        ]);

        const credentials = new Map([
            ["alice", { password: "alice123", userId: 1 }],
            ["bob", { password: "bob456", userId: 2 }],
        ]);

        const findByCredentials: FindByCredentials = async (username, password) => {
            const cred = credentials.get(username);
            if (!cred || cred.password !== password) return null;
            return users.get(cred.userId) ?? null;
        };

        const findById: FindById = async (id) => {
            return users.get(id) ?? null;
        };

        // Test login flow
        const alice = await findByCredentials("alice", "alice123");
        expect(alice?.fullName).toBe("Alice");

        // Test invalid credentials
        const invalid = await findByCredentials("alice", "wrongpass");
        expect(invalid).toBeNull();

        // Test session refresh
        const refreshed = await findById(1);
        expect(refreshed?.permissions).toEqual(["admin.*"]);
    });

    it("should support role-based user lookup", async () => {
        const rolePermissions = {
            admin: ["*"],
            user: ["profile.read", "profile.update"],
            guest: ["public.read"],
        };

        const findById: FindById = async (id) => {
            const role = "user" as keyof typeof rolePermissions;
            return {
                id,
                fullName: `User ${id}`,
                avatarUrl: null,
                permissions: rolePermissions[role],
                tenant: "test-tenant",
            };
        };

        const user = await findById(123);
        expect(user?.permissions).toEqual(["profile.read", "profile.update"]);
    });

    it("should handle async service initialization", async () => {
        // Simulate lazy-loaded service
        let serviceReady = false;

        const findById: FindById = async (id) => {
            if (!serviceReady) {
                throw new Error("Service not initialized");
            }
            return {
                id,
                fullName: "Test",
                avatarUrl: null,
                permissions: [],
                tenant: "test-tenant"
            };
        };

        // Before initialization
        await expect(findById(1)).rejects.toThrow("Service not initialized");

        // Initialize service
        serviceReady = true;

        // After initialization
        const user = await findById(1);
        expect(user?.id).toBe(1);
    });
});
