
import { boolean, serial, varchar } from "drizzle-orm/pg-core";
import { schema } from "#models/agape";


/**
 * Modelo de tipo de cliente (ClientType)
 * Representa los diferentes tipos de clientes.
 */
const client_type = schema.table("crm_client_type", {
  /** Identificador único del tipo de cliente */
  id: serial("id").primaryKey(),
  /** Nombre del tipo de cliente (ej: 'Retail', 'Wholesale', 'VIP') */
  name: varchar("name", { length: 50 }).notNull(),
  /** Indica si el tipo de cliente está deshabilitado */
  disabled: boolean("disabled").default(false).notNull(),
});

export default client_type;