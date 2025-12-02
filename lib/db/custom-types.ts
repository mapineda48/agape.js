import { customType } from "drizzle-orm/pg-core";
import Decimal from "../utils/data/Decimal";
import DateTime from "../utils/data/DateTime";

export const decimal = customType<{ data: Decimal; driverData: string }>({
  dataType() {
    return "numeric(10, 2)";
  },
  toDriver(value: Decimal): string {
    return value.toString();
  },
  fromDriver(value: string): Decimal {
    return new Decimal(value);
  },
});

export const dateTime = customType<{ data: DateTime; driverData: string }>({
  dataType() {
    return "timestamp with time zone";
  },
  toDriver(value: DateTime): string {
    return value.toISOString();
  },
  fromDriver(value: string): DateTime {
    return new DateTime(value);
  },
});
