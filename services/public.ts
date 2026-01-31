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
