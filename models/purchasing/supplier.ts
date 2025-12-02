import { serial, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { schema } from "../agape";
import person from "../core/person";
import supplier_type from "./supplier_type";
import { dateTime } from "../../lib/db/custom-types";

/**
 * Modelo de proveedor (Supplier)
 * Representa un proveedor registrado en el sistema.
 */
const supplier = schema.table("purchasing_supplier", {
  /** Identificador único del proveedor */
  id: serial("id").primaryKey(),
  /** Identificador de la persona asociada al proveedor */
  personId: integer("person_id")
    .notNull()
    .references(() => person.id),
  /** Identificador del tipo de proveedor */
  supplierTypeId: integer("supplier_type_id")
    .notNull()
    .references(() => supplier_type.id),
  /** Fecha de registro del proveedor */
  registrationDate: dateTime("registration_date")
    .default(sql`now()`)
    .notNull(),
  /** Indica si el proveedor está activo */
  active: boolean("active").default(true).notNull(),
});

export default supplier;
