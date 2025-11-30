//   if (
//     value &&
//     typeof value === "object" &&
//     Object.prototype.hasOwnProperty.call(value, DATETIME_MARK) &&
//     typeof (value as any)[DATETIME_MARK] === "string"
//   ) {
//     return new DateTime((value as any)[DATETIME_MARK]);
//   }

export default function isCustom<K extends string>(
  value: unknown,
  mark: K
): value is { [P in K]: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, mark) &&
    typeof (value as any)[mark] === "string"
  );
}
