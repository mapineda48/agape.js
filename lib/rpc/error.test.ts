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
});
