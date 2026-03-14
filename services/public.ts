import { z } from "zod";
import { withValidation } from "#lib/rpc/validation";
import type Decimal from "#shared/data/Decimal";

/**
 * Public endpoint - no authentication required.
 * @public
 */
export function sayHello(
  fullName: string,
  file?: File,
  files?: File[],
  decimal?: Decimal,
) {
  if (file) {
    console.log(file);
  }

  if (files) {
    console.log(files);
  }

  console.log(fullName);

  return Promise.resolve(`Hello ${fullName}`);
}

/**
 * Public endpoint with input validation.
 * Demonstrates using withValidation to attach a Zod schema.
 * @public
 */
export const addNumbers = withValidation(
  z.tuple([z.number(), z.number()]),
  (a: number, b: number) => {
    return a + b;
  },
);
