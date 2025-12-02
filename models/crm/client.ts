import {
  serial,
  integer,
  timestamp,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";
import { schema } from "../agape";
import person from "../core/person";
import client_type from "./client_type";

/**
 * Modelo de cliente (Client)
 * Representa un cliente en el sistema CRM.
 */
const client = schema.table("crm_client", {
  /** Identificador único del cliente */
  id: serial("id").primaryKey(),
  /** Identificador de la persona asociada al cliente */
  personId: integer("person_id")
    .notNull()
    .references(() => person.id)
    .unique(),
  /** Identificador del tipo de cliente */
  typeId: integer("type_id").references(() => client_type.id),
  /** URL de la foto del cliente */
  photoUrl: varchar("photo_url", { length: 500 }),
  /** Indica si el cliente está activo */
  active: boolean("active").default(true).notNull(),
  /** Fecha de creación del registro */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  /** Fecha de última actualización del registro */
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export default client;
