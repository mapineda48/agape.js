import { serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";
import person from "#models/core/person";
import supplier_type from "./supplier_type";


/**
 * Modelo de proveedor (Supplier)
 * Representa un proveedor registrado en el sistema.
 */
const supplier = schema.table("purchasing_supplier", {
  /** Identificador único del proveedor */
  id: serial("id").primaryKey(),
  /** Identificador de la persona asociada al proveedor */
  personId: integer("person_id").notNull().references(() => person.id),
  /** Identificador del tipo de proveedor */
  supplierTypeId: integer("supplier_type_id").notNull().references(() => supplier_type.id),
  /** Fecha de registro del proveedor */
  registrationDate: timestamp("registration_date", { withTimezone: true }).defaultNow().notNull(),
  /** Indica si el proveedor está activo */
  active: boolean("active").default(true).notNull(),
});

export default supplier;
