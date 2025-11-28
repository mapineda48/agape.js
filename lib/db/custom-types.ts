import { customType } from "drizzle-orm/pg-core";
import Decimal from "../utils/data/Decimal";

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
