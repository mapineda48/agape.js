/**
 * Service Contract: Public
 *
 * Type-only contract for the public RPC endpoint.
 * The actual implementation lives in services/public.ts (backend only).
 */

import type Decimal from "#shared/data/Decimal";

export function sayHello(
  fullName: string,
  file?: File,
  files?: File[],
  decimal?: Decimal,
): Promise<string>;
