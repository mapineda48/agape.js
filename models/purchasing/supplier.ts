import { integer, boolean } from "drizzle-orm/pg-core";
import { sql, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { schema } from "../agape";
import user from "../core/user";
import supplier_type from "./supplier_type";
import { dateTime } from "../../lib/db/custom-types";

/**
 * Modelo de proveedor (Supplier)
 * Representa un proveedor registrado en el sistema.
 * Implementa Class Table Inheritance (CTI): PK = FK a user.id.
 * El id NO es serial porque se hereda del registro padre en user.
 */
const supplier = schema.table("purchasing_supplier", {
  /**
   * Identificador único del proveedor.
   * Es FK a user.id (un proveedor ES un user).
   * No es serial: el id se asigna desde la tabla padre user.
   */
  id: integer("id")
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
