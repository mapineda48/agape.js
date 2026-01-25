import type Decimal from "#shared/data/Decimal";

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
