import { describe, it, expect, vi } from "vitest";

// Mock the logger to prevent side effects
vi.mock("#lib/log/logger", () => ({
  default: {
    scope: () => ({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    }),
  },
}));

const { default: parseError } = await import("./error.ts");

describe("rpc/error - parseError", () => {
  describe("standard Error objects", () => {
    it("passes through application errors with their message", () => {
      const error = new Error("User not found");
      const result = parseError(error);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("User not found");
    });

    it("preserves error identity for non-DB errors", () => {
      const error = new Error("Custom app error");
      const result = parseError(error);
      // The same error instance should be returned
      expect(result).toBe(error);
    });
  });

  describe("string errors", () => {
    it("returns a generic error for string input", () => {
      const result = parseError("something broke");

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Ups... Something went wrong!");
    });
  });

  describe("unknown error types", () => {
    it("returns a generic error for null", () => {
      const result = parseError(null);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Ups... Something went wrong!");
    });

    it("returns a generic error for undefined", () => {
      const result = parseError(undefined);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Ups... Something went wrong!");
    });

    it("returns a generic error for number", () => {
      const result = parseError(42);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Ups... Something went wrong!");
    });

    it("returns a generic error for plain object", () => {
      const result = parseError({ foo: "bar" });
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Ups... Something went wrong!");
    });
  });

  describe("database errors (PostgreSQL)", () => {
    it("normalizes unique violation error", () => {
      const dbError = Object.assign(new Error("duplicate key value"), {
        code: "23505",
        detail: 'Key (email)=(test@test.com) already exists.',
        constraint: "users_email_key",
      });

      const result = parseError(dbError);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("Email");
      expect(result.message).toContain("already exists");
    });

    it("normalizes not-null violation error", () => {
      const dbError = Object.assign(new Error("null value in column"), {
        code: "23502",
        column: "username",
      });

      const result = parseError(dbError);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("Username");
      expect(result.message).toContain("required");
    });

    it("normalizes foreign key violation error", () => {
      const dbError = Object.assign(new Error("insert or update violates"), {
        code: "23503",
        constraint: "orders_user_id_fkey",
      });

      const result = parseError(dbError);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("does not exist");
    });

    it("normalizes foreign key violation with referenced record", () => {
      const dbError = Object.assign(new Error("update or delete violates"), {
        code: "23503",
        detail: "Key (id)=(1) is still referenced from table orders.",
      });

      const result = parseError(dbError);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("cannot be deleted");
    });
  });

  describe("Drizzle ORM wrapped errors (cause chain)", () => {
    it("extracts database error from cause property", () => {
      const pgError = Object.assign(new Error("duplicate key"), {
        code: "23505",
        detail: 'Key (document_number)=(123) already exists.',
      });
      const drizzleError = new Error("Drizzle query failed");
      (drizzleError as Error & { cause?: unknown }).cause = pgError;

      const result = parseError(drizzleError);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("Document Number");
      expect(result.message).toContain("already exists");
    });

    it("handles plain object cause with database error shape", () => {
      const cause = {
        code: "23505",
        message: "duplicate key",
        detail: 'Key (name)=(test) already exists.',
      };
      const wrappedError = new Error("Query failed");
      (wrappedError as Error & { cause?: unknown }).cause = cause;

      const result = parseError(wrappedError);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("Name");
      expect(result.message).toContain("already exists");
    });
  });

  describe("error with custom properties", () => {
    it("preserves error code property on pass-through", () => {
      const error = Object.assign(new Error("Forbidden"), {
        code: "FORBIDDEN_ERROR",
      });

      const result = parseError(error);
      // Not a DB error code pattern, so it passes through as-is
      expect(result).toBe(error);
      expect(result.message).toBe("Forbidden");
    });
  });
});
