/**
 * Service Contract: Web
 *
 * Type-only contract for the web error notification service.
 * The actual implementation lives in services/web.ts (backend only).
 */

export function notifyError(stack: string): Promise<void>;
