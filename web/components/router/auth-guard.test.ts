import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthGuard } from "./auth-guard";
import type { INavigateTo } from "./types";

// Mock @agape/security/access
const mockIsAuthenticated = vi.fn();
vi.mock("@agape/security/access", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
}));

describe("AuthGuard", () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
    vi.clearAllMocks();
  });

  describe("isProtectedRoute matching", () => {
    it("should NOT match /cms-other (wrong prefix boundary)", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: "user-1" });
      const ctx: INavigateTo = {};

      // /cms-other should pass through since it's not actually /cms or /cms/*
      const result = await guard.check("/cms-other", ctx);

      expect(result).toBe("/cms-other");
      expect(ctx.replace).toBeUndefined(); // Not set for non-protected routes
    });

    it("should NOT match /login-restore (wrong prefix boundary)", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: "user-1" });
      const ctx: INavigateTo = {};

      const result = await guard.check("/login-restore", ctx);

      expect(result).toBe("/login-restore");
      expect(ctx.replace).toBeUndefined();
    });

    it("should match /cms exactly", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: "user-1" });
      const ctx: INavigateTo = {};

      const result = await guard.check("/cms", ctx);

      expect(result).toBe("/cms");
      expect(ctx.replace).toBe(true);
    });

    it("should match /cms/dashboard (with subpath)", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: "user-1" });
      const ctx: INavigateTo = {};

      const result = await guard.check("/cms/dashboard", ctx);

      expect(result).toBe("/cms/dashboard");
      expect(ctx.replace).toBe(true);
    });

    it("should match /login exactly", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: "user-1" });
      const ctx: INavigateTo = {};

      const result = await guard.check("/login", ctx);

      // Authenticated user at /login should redirect to /cms
      expect(result).toBe("/cms");
      expect(ctx.replace).toBe(true);
    });

    it("should match /login/forgot-password (with subpath)", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: null });
      const ctx: INavigateTo = {};

      const result = await guard.check("/login/forgot-password", ctx);

      expect(result).toBe("/login");
      expect(ctx.replace).toBe(true);
    });
  });

  describe("authentication redirects", () => {
    it("should allow authenticated user to access /cms", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: "user-1" });
      const ctx: INavigateTo = {};

      const result = await guard.check("/cms", ctx);

      expect(result).toBe("/cms");
    });

    it("should redirect unauthenticated user from /cms to /login", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: null });
      const ctx: INavigateTo = {};

      const result = await guard.check("/cms", ctx);

      expect(result).toBe("/login");
    });

    it("should redirect authenticated user from /login to /cms", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: "user-1" });
      const ctx: INavigateTo = {};

      const result = await guard.check("/login", ctx);

      expect(result).toBe("/cms");
    });

    it("should keep unauthenticated user at /login", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: null });
      const ctx: INavigateTo = {};

      const result = await guard.check("/login", ctx);

      expect(result).toBe("/login");
    });
  });

  describe("ctx.replace mutation", () => {
    it("should set ctx.replace = true for protected routes", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: "user-1" });
      const ctx: INavigateTo = { replace: false };

      await guard.check("/cms", ctx);

      expect(ctx.replace).toBe(true);
    });

    it("should NOT modify ctx.replace for non-protected routes", async () => {
      mockIsAuthenticated.mockResolvedValue({ id: "user-1" });
      const ctx: INavigateTo = { replace: false };

      await guard.check("/about", ctx);

      expect(ctx.replace).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should redirect to /login on auth error", async () => {
      mockIsAuthenticated.mockRejectedValue(new Error("Network error"));
      const ctx: INavigateTo = {};

      const result = await guard.check("/cms", ctx);

      expect(result).toBe("/login");
    });

    it("should log error in development mode", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockIsAuthenticated.mockRejectedValue(new Error("Test error"));
      const ctx: INavigateTo = {};

      await guard.check("/cms", ctx);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("non-protected routes", () => {
    it("should pass through / without auth check", async () => {
      const ctx: INavigateTo = {};

      const result = await guard.check("/", ctx);

      expect(result).toBe("/");
      expect(mockIsAuthenticated).not.toHaveBeenCalled();
    });

    it("should pass through /about without auth check", async () => {
      const ctx: INavigateTo = {};

      const result = await guard.check("/about", ctx);

      expect(result).toBe("/about");
      expect(mockIsAuthenticated).not.toHaveBeenCalled();
    });

    it("should pass through /products/123 without auth check", async () => {
      const ctx: INavigateTo = {};

      const result = await guard.check("/products/123", ctx);

      expect(result).toBe("/products/123");
      expect(mockIsAuthenticated).not.toHaveBeenCalled();
    });
  });
});
