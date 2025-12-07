import { describe, it, expect, vi, beforeEach } from "vitest";
import parseError from "./error";

describe("parseError", () => {
  beforeEach(() => {
    // Mock console.error to avoid noise in test output
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("PostgreSQL database errors", () => {
    describe("UNIQUE_VIOLATION (23505)", () => {
      it("should normalize unique violation with column info", () => {
        const dbError = Object.assign(
          new Error("duplicate key value violates unique constraint"),
          {
            code: "23505",
            detail: "Key (email)=(test@example.com) already exists.",
            constraint: "user_email_key",
            table: "user",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("already exists");
        expect(result.message).toContain("Email");
      });

      it("should normalize unique violation without column info", () => {
        const dbError = Object.assign(
          new Error("duplicate key value violates unique constraint"),
          {
            code: "23505",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("already exists");
      });

      it("should extract field name from constraint name", () => {
        const dbError = Object.assign(new Error("duplicate key"), {
          code: "23505",
          constraint: "supplier_document_number_unique",
        });

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("Document Number");
      });
    });

    describe("NOT_NULL_VIOLATION (23502)", () => {
      it("should normalize not null violation with column", () => {
        const dbError = Object.assign(
          new Error('null value in column "name" violates not-null constraint'),
          {
            code: "23502",
            column: "name",
            table: "supplier",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("required");
        expect(result.message).toContain("Name");
      });

      it("should normalize not null violation without column", () => {
        const dbError = Object.assign(
          new Error("null value violates not-null constraint"),
          {
            code: "23502",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("required");
      });
    });

    describe("FOREIGN_KEY_VIOLATION (23503)", () => {
      it("should normalize foreign key violation on insert", () => {
        const dbError = Object.assign(
          new Error(
            "insert or update on table violates foreign key constraint"
          ),
          {
            code: "23503",
            detail:
              'Key (supplier_type_id)=(999) is not present in table "supplier_type".',
            constraint: "supplier_supplier_type_id_fkey",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("does not exist");
      });

      it("should normalize foreign key violation on delete (referenced by others)", () => {
        const dbError = Object.assign(
          new Error(
            "update or delete on table violates foreign key constraint"
          ),
          {
            code: "23503",
            detail: 'Key (id)=(1) is still referenced from table "supplier".',
            constraint: "supplier_supplier_type_id_fkey",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("cannot be deleted");
        expect(result.message).toContain("referenced");
      });
    });

    describe("CHECK_VIOLATION (23514)", () => {
      it("should normalize check violation", () => {
        const dbError = Object.assign(
          new Error("new row violates check constraint"),
          {
            code: "23514",
            constraint: "order_quantity_check",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("not valid");
      });
    });

    describe("NUMERIC_VALUE_OUT_OF_RANGE (22003)", () => {
      it("should normalize numeric overflow", () => {
        const dbError = Object.assign(new Error("numeric field overflow"), {
          code: "22003",
          column: "quantity",
        });

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("out of the allowed range");
        expect(result.message).toContain("Quantity");
      });
    });

    describe("STRING_DATA_RIGHT_TRUNCATION (22001)", () => {
      it("should normalize string too long error", () => {
        const dbError = Object.assign(
          new Error("value too long for type character varying(100)"),
          {
            code: "22001",
            column: "description",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("too long");
        expect(result.message).toContain("Description");
      });
    });

    describe("INVALID_TEXT_REPRESENTATION (22P02)", () => {
      it("should normalize invalid format error", () => {
        const dbError = Object.assign(
          new Error('invalid input syntax for type integer: "abc"'),
          {
            code: "22P02",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("format");
        expect(result.message).toContain("not valid");
      });
    });

    describe("DATETIME_FIELD_OVERFLOW (22008)", () => {
      it("should normalize datetime error", () => {
        const dbError = Object.assign(
          new Error("date/time field value out of range"),
          {
            code: "22008",
            column: "created_at",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("date/time");
        expect(result.message).toContain("Created At");
      });
    });

    describe("CONNECTION_EXCEPTION (08000)", () => {
      it("should normalize connection error", () => {
        const dbError = Object.assign(new Error("connection refused"), {
          code: "08000",
        });

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("Unable to connect");
      });
    });

    describe("UNDEFINED_TABLE (42P01)", () => {
      it("should normalize undefined table error", () => {
        const dbError = Object.assign(
          new Error('relation "nonexistent" does not exist'),
          {
            code: "42P01",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("schema error");
      });
    });

    describe("Unknown database error codes", () => {
      it("should provide generic message for unhandled codes", () => {
        const dbError = Object.assign(
          new Error("some unusual database error"),
          {
            code: "99999",
          }
        );

        const result = parseError(dbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("database error");
        expect(console.warn).toHaveBeenCalledWith(
          "Unhandled database error code:",
          "99999",
          expect.any(String)
        );
      });
    });
  });

  describe("Application errors", () => {
    it("should pass through regular Error instances", () => {
      const appError = new Error("User not found");

      const result = parseError(appError);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("User not found");
    });

    it("should pass through custom error messages", () => {
      const appError = new Error("Insufficient inventory for this operation");

      const result = parseError(appError);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe("Insufficient inventory for this operation");
    });
  });

  describe("Unknown error types", () => {
    it("should handle string errors", () => {
      const result = parseError("Something failed");

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("Something went wrong");
    });

    it("should handle null", () => {
      const result = parseError(null);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("Something went wrong");
    });

    it("should handle undefined", () => {
      const result = parseError(undefined);

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("Something went wrong");
    });

    it("should handle object without Error prototype", () => {
      const result = parseError({ message: "not a real error" });

      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain("Something went wrong");
    });
  });

  describe("Field name extraction", () => {
    it("should format snake_case field names", () => {
      const dbError = Object.assign(new Error("null value"), {
        code: "23502",
        column: "document_number",
      });

      const result = parseError(dbError);

      expect(result.message).toContain("Document Number");
    });

    it("should format camelCase field names", () => {
      const dbError = Object.assign(new Error("null value"), {
        code: "23502",
        column: "documentNumber",
      });

      const result = parseError(dbError);

      expect(result.message).toContain("Document Number");
    });

    it("should extract field from constraint pattern table_column_key", () => {
      const dbError = Object.assign(new Error("unique violation"), {
        code: "23505",
        constraint: "supplier_email_key",
      });

      const result = parseError(dbError);

      expect(result.message).toContain("Email");
    });

    it("should extract field from detail Key clause", () => {
      const dbError = Object.assign(new Error("unique violation"), {
        code: "23505",
        detail: "Key (nit_number)=(123456) already exists.",
      });

      const result = parseError(dbError);

      expect(result.message).toContain("Nit Number");
    });
  });

  describe("Drizzle ORM wrapped errors", () => {
    describe("Error in cause property (as Error instance)", () => {
      it("should normalize unique violation from Drizzle error cause", () => {
        // Simulate a Drizzle-wrapped error where cause is a PostgreSQL error
        const pgError = Object.assign(
          new Error("duplicate key value violates unique constraint"),
          {
            code: "23505",
            detail: "Key (document_number)=(12345678) already exists.",
            constraint: "user_document_number_key",
            table: "user",
          }
        );

        const drizzleError = new Error(
          "DrizzleError: Query failed"
        ) as Error & { cause: Error };
        drizzleError.cause = pgError;

        const result = parseError(drizzleError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("already exists");
        expect(result.message).toContain("Document Number");
      });

      it("should normalize not null violation from Drizzle error cause", () => {
        const pgError = Object.assign(
          new Error('null value in column "name" violates not-null constraint'),
          {
            code: "23502",
            column: "name",
            table: "supplier",
          }
        );

        const drizzleError = new Error("Query failed") as Error & {
          cause: Error;
        };
        drizzleError.cause = pgError;

        const result = parseError(drizzleError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("required");
        expect(result.message).toContain("Name");
      });

      it("should normalize foreign key violation from Drizzle error cause", () => {
        const pgError = Object.assign(
          new Error("insert or update violates foreign key constraint"),
          {
            code: "23503",
            detail:
              'Key (supplier_type_id)=(999) is not present in table "supplier_type".',
            constraint: "supplier_supplier_type_id_fkey",
          }
        );

        const drizzleError = new Error("Query failed") as Error & {
          cause: Error;
        };
        drizzleError.cause = pgError;

        const result = parseError(drizzleError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("does not exist");
      });
    });

    describe("Error in cause property (as plain object)", () => {
      it("should normalize error when cause is a plain object with database error properties", () => {
        // Some drivers might expose cause as a plain object instead of Error instance
        const drizzleError = new Error("Query failed") as Error & {
          cause: Record<string, unknown>;
        };
        drizzleError.cause = {
          code: "23505",
          message: "duplicate key value violates unique constraint",
          detail: "Key (email)=(test@example.com) already exists.",
          constraint: "user_email_key",
          table: "user",
        };

        const result = parseError(drizzleError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("already exists");
        expect(result.message).toContain("Email");
      });

      it("should normalize not null violation when cause is a plain object", () => {
        const drizzleError = new Error("Query failed") as Error & {
          cause: Record<string, unknown>;
        };
        drizzleError.cause = {
          code: "23502",
          message: "null value violates not-null constraint",
          column: "phone",
        };

        const result = parseError(drizzleError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("required");
        expect(result.message).toContain("Phone");
      });
    });

    describe("Nested cause chain", () => {
      it("should find database error in deeply nested cause chain", () => {
        const pgError = Object.assign(new Error("unique violation"), {
          code: "23505",
          column: "nit",
        });

        // Simulate multiple layers of wrapping
        const innerWrapper = new Error("Inner wrapper") as Error & {
          cause: Error;
        };
        innerWrapper.cause = pgError;

        const outerWrapper = new Error("Outer wrapper") as Error & {
          cause: Error;
        };
        outerWrapper.cause = innerWrapper;

        const result = parseError(outerWrapper);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("already exists");
        expect(result.message).toContain("Nit");
      });

      it("should respect max depth and not loop infinitely", () => {
        // Create a very deep chain (more than maxDepth)
        let currentError: Error = new Error("Regular error");

        // Create 10 levels of nesting (more than the default maxDepth of 5)
        for (let i = 0; i < 10; i++) {
          const wrapper = new Error(`Level ${i}`) as Error & { cause: Error };
          wrapper.cause = currentError;
          currentError = wrapper;
        }

        const result = parseError(currentError);

        // Should fall back to the original behavior (pass through the Error)
        expect(result).toBeInstanceOf(Error);
        // It should be one of the wrapper errors, not crash
      });
    });

    describe("Mixed scenarios", () => {
      it("should prefer direct database error over wrapped one", () => {
        // Direct database error takes precedence
        const directDbError = Object.assign(new Error("Direct DB error"), {
          code: "23505",
          column: "email",
        });

        const result = parseError(directDbError);

        expect(result).toBeInstanceOf(Error);
        expect(result.message).toContain("Email");
      });

      it("should handle Drizzle error without database error in cause", () => {
        // A Drizzle error that doesn't have a PG error in cause
        const drizzleError = new Error("Something else went wrong") as Error & {
          cause: Error;
        };
        drizzleError.cause = new Error("Network timeout");

        const result = parseError(drizzleError);

        expect(result).toBeInstanceOf(Error);
        // Should pass through the original Drizzle error message
        expect(result.message).toBe("Something else went wrong");
      });
    });
  });
});
