import { serial, integer, boolean, varchar } from "drizzle-orm/pg-core";
import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { schema } from "../agape";
import user from "../core/user";
import client_type from "./client_type";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Modelo de cliente (Client)
 * Representa un cliente en el sistema CRM.
 */
const client = schema.table("crm_client", {
  /**
   * Identificador único de el cliente
   * Además es FK a user.id (un cliente es una user).
   */
  id: serial("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "restrict" }),

  /** Identificador del tipo de cliente */
  typeId: integer("type_id").references(() => client_type.id),
  /** URL de la foto del cliente */
  photoUrl: varchar("photo_url", { length: 500 }),
  /** Indica si el cliente está activo */
  active: boolean("active").default(true).notNull(),
  /** Fecha de creación del registro */
  createdAt: dateTime("created_at")
    .default(sql`now()`)
    .notNull(),
  /** Fecha de última actualización del registro */
  updatedAt: dateTime("updated_at")
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

export type Client = InferSelectModel<typeof client>;
export type NewClient = InferInsertModel<typeof client>;

export default client;
