import { serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import person from "#models/core/person";
import supplier_type from "./supplier_type";

const supplier = schema.table("purchasing_supplier", {
  id: serial("id").primaryKey(),
  personId: integer("person_id").notNull().references(() => person.id),
  supplierTypeId: integer("supplier_type_id").notNull().references(() => supplier_type.id),
  registrationDate: timestamp("registration_date", { withTimezone: true }).defaultNow().notNull(), // fecha de registro del proveedor
  active: boolean("active").default(true).notNull(), // indica si el proveedor está activo
});

export default supplier;
