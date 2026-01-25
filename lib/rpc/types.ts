/**
 * RPC Module Types
 *
 * Type definitions for the RPC module, providing better type safety
 * and documentation.
 */

import type { Request } from "express";

/**
 * Represents a file uploaded through the RPC system.
 */
export interface UploadedFile {
    /** Generated unique filename */
    name: string;
    /** MIME type of the file */
    type: string | null;
    /** Function to create a readable stream of the file */
    stream: () => NodeJS.ReadableStream;
}

/**
 * Metadata for tracking uploaded files and their target locations
 * within the payload structure.
 */
export interface UploadedFileMetadata {
    /** Array of keys representing the path to the file in the payload */
    paths: (string | number)[];
    /** The uploaded file object */
    file: UploadedFile;
}

/**
 * Express Request with raw body buffer for msgpack parsing.
 */
export type RpcRequest = Request;

/**
 * PostgreSQL SQLSTATE error codes for common database errors.
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_ERROR_CODES = {
    // Integrity Constraint Violations (Class 23)
    UNIQUE_VIOLATION: "23505",
    NOT_NULL_VIOLATION: "23502",
    FOREIGN_KEY_VIOLATION: "23503",
    CHECK_VIOLATION: "23514",

    // Data Exception (Class 22)
    NUMERIC_VALUE_OUT_OF_RANGE: "22003",
    STRING_DATA_RIGHT_TRUNCATION: "22001",
    DATETIME_FIELD_OVERFLOW: "22008",
    INVALID_TEXT_REPRESENTATION: "22P02",

    // Connection Exception (Class 08)
    CONNECTION_EXCEPTION: "08000",

    // Invalid Catalog Name (Class 3D)
    UNDEFINED_DATABASE: "3D000",

    // Syntax Error or Access Rule Violation (Class 42)
    UNDEFINED_TABLE: "42P01",
    UNDEFINED_COLUMN: "42703",
} as const;

export type PgErrorCode = (typeof PG_ERROR_CODES)[keyof typeof PG_ERROR_CODES];

/**
 * Interface representing a PostgreSQL DatabaseError structure.
 * These properties are available on errors thrown by the `pg` library.
 */
export interface DatabaseError extends Error {
    code?: string;
    detail?: string;
    constraint?: string;
    table?: string;
    column?: string;
    schema?: string;
    severity?: string;
    hint?: string;
}