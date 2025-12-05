import { describe, it, expect, vi, beforeEach } from "vitest";
import { RouteRegistry } from "./route-registry";

describe("RouteRegistry - Pattern Matching", () => {
  describe("toPathnameFromPage - [param] to :param conversion", () => {
    let registry: RouteRegistry;

    beforeEach(() => {
      registry = new RouteRegistry({}, {});
    });

    it("should convert [id] to :id", () => {
      const modules = {
        "./users/[id]/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
      };

      registry = new RouteRegistry(modules, {});
      const result = (registry as any).routes;

      expect(result).toHaveProperty("/users/:id");
    });

    it("should convert multiple params [postId] and [commentId]", () => {
      const modules = {
        "./posts/[postId]/comments/[commentId]/page.tsx": vi
          .fn()
          .mockResolvedValue({
            default: () => null,
          }),
      };

      registry = new RouteRegistry(modules, {});
      const result = (registry as any).routes;

      expect(result).toHaveProperty("/posts/:postId/comments/:commentId");
    });

    it("should handle mixed static and dynamic segments", () => {
      const modules = {
        "./users/[id]/edit/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
      };

      registry = new RouteRegistry(modules, {});
      const result = (registry as any).routes;

      expect(result).toHaveProperty("/users/:id/edit");
    });

    it("should not affect static routes", () => {
      const modules = {
        "./about/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
      };

      registry = new RouteRegistry(modules, {});
      const result = (registry as any).routes;

      expect(result).toHaveProperty("/about");
      expect(result).not.toHaveProperty("/about/:param");
    });
  });

  describe("getPageWithParams - Route matching and param extraction", () => {
    let registry: RouteRegistry;

    beforeEach(() => {
      const modules = {
        "./users/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
        "./users/[id]/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
        "./posts/[postId]/comments/[commentId]/page.tsx": vi
          .fn()
          .mockResolvedValue({
            default: () => null,
          }),
        "./products/[id]/edit/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
      };

      registry = new RouteRegistry(modules, {});
    });

    it("should match exact static route", () => {
      const result = registry.getPageWithParams("/users");

      expect(result).not.toBeNull();
      expect(result?.params).toEqual({});
      expect(result?.pattern).toBe("/users");
    });

    it("should match single param route and extract param", () => {
      const result = registry.getPageWithParams("/users/123");

      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ id: "123" });
      expect(result?.pattern).toBe("/users/:id");
    });

    it("should match multi-param route and extract all params", () => {
      const result = registry.getPageWithParams("/posts/42/comments/99");

      expect(result).not.toBeNull();
      expect(result?.params).toEqual({
        postId: "42",
        commentId: "99",
      });
      expect(result?.pattern).toBe("/posts/:postId/comments/:commentId");
    });

    it("should match route with param followed by static segment", () => {
      const result = registry.getPageWithParams("/products/abc123/edit");

      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ id: "abc123" });
      expect(result?.pattern).toBe("/products/:id/edit");
    });

    it("should decode URL-encoded params", () => {
      const result = registry.getPageWithParams("/users/hello%20world");

      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ id: "hello world" });
    });

    it("should return null for non-matching routes", () => {
      const result = registry.getPageWithParams("/non-existent");

      expect(result).toBeNull();
    });

    it("should return null when segment count doesn't match", () => {
      const result = registry.getPageWithParams("/users/123/extra/segment");

      expect(result).toBeNull();
    });

    it("should prefer exact match over parameterized match", () => {
      const modules = {
        "./users/page.tsx": vi.fn().mockResolvedValue({
          default: () => "static",
        }),
        "./users/[id]/page.tsx": vi.fn().mockResolvedValue({
          default: () => "dynamic",
        }),
      };

      const reg = new RouteRegistry(modules, {});
      const result = reg.getPageWithParams("/users");

      expect(result).not.toBeNull();
      expect(result?.params).toEqual({});
      expect(result?.pattern).toBe("/users");
    });
  });

  describe("Edge cases", () => {
    it("should handle numeric params", () => {
      const modules = {
        "./items/[id]/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
      };

      const registry = new RouteRegistry(modules, {});
      const result = registry.getPageWithParams("/items/12345");

      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ id: "12345" });
    });

    it("should handle params with special characters", () => {
      const modules = {
        "./files/[name]/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
      };

      const registry = new RouteRegistry(modules, {});
      const result = registry.getPageWithParams("/files/my-file.txt");

      expect(result).not.toBeNull();
      expect(result?.params).toEqual({ name: "my-file.txt" });
    });

    it("should handle UUID-like params", () => {
      const modules = {
        "./entities/[uuid]/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
      };

      const registry = new RouteRegistry(modules, {});
      const result = registry.getPageWithParams(
        "/entities/550e8400-e29b-41d4-a716-446655440000"
      );

      expect(result).not.toBeNull();
      expect(result?.params).toEqual({
        uuid: "550e8400-e29b-41d4-a716-446655440000",
      });
    });

    it("should handle empty string params (edge case)", () => {
      const modules = {
        "./test/[param]/page.tsx": vi.fn().mockResolvedValue({
          default: () => null,
        }),
      };

      const registry = new RouteRegistry(modules, {});
      // Empty segment should still match
      const result = registry.getPageWithParams("/test//");

      // This should not match because segments are filtered
      expect(result).toBeNull();
    });
  });
});
