import { serial, integer, boolean } from "drizzle-orm/pg-core";
import { sql, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { schema } from "../agape";
import user from "../core/user";
import supplier_type from "./supplier_type";
import { dateTime } from "../../lib/db/custom-types";

/**
 * Modelo de proveedor (Supplier)
 * Representa un proveedor registrado en el sistema.
 */
const supplier = schema.table("purchasing_supplier", {
  /**
   * Identificador único del proveedor
   * Además es FK a user.id (un proveedor es una user).
   */
  id: serial("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "restrict" }),

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

export type Supplier = InferSelectModel<typeof supplier>;
export type NewSupplier = InferInsertModel<typeof supplier>;

export default supplier;
