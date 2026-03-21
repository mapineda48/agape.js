/**
 * RPC Module Constants
 *
 * Centralized constants used across the RPC module for consistency
 * and easier maintenance.
 */

/**
 * HTTP status codes used in RPC responses.
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
} as const;
