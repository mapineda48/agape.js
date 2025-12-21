import { boolean, serial, varchar } from "drizzle-orm/pg-core";
import ctx from "../../lib/db/schema/ctx";


/**
 * Modelo de tipo de orden (OrderType)
 * Representa los diferentes tipos de ordenes de cliente.
 */
const order_type = ctx(({ table }) => table("crm_order_type", {
  /** Identificador único del tipo de orden */
  id: serial("id").primaryKey(),
  /** Nombre del tipo de orden (ej: 'Online', 'InStore', 'Wholesale') */
  name: varchar("name", { length: 50 }).notNull(),
  /** Indica si el tipo de orden está deshabilitado */
  disabled: boolean("disabled").default(false).notNull(),
}));

export default order_type;
