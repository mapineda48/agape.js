/**
 * Service Contract: Public
 *
 * Runtime stubs for the public RPC endpoint.
 * The actual implementation lives in backend/services/public.ts.
 * The Vite generator imports these to discover endpoints.
 */

import type Decimal from "../data/Decimal";

/* eslint-disable @typescript-eslint/no-unused-vars */

export function sayHello(
  fullName: string,
  file?: File,
  files?: File[],
  decimal?: Decimal,
): Promise<string> {
  throw new Error("Contract stub");
}

export function addNumbers(a: number, b: number): number {
  throw new Error("Contract stub");
}
