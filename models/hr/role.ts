import { serial, varchar, text, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { schema } from "../agape";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Modelo de rol de HR (Role)
 * Representa un rol o puesto dentro de la organización.
 */
const role = schema.table("hr_role", {
  /** Identificador único del rol */
  id: serial("id").primaryKey(),

  /** Código corto del rol */
  code: varchar("code", { length: 10 }).notNull(),

  /** Nombre del rol */
  name: varchar("name", { length: 100 }).notNull(),

  /** Descripción del rol */
  description: text("description"),

  /** Indica si el rol está activo */
  isActive: boolean("is_active").default(true).notNull(),

  /** Fecha de creación del rol */
  createdAt: dateTime("created_at").default(sql`now()`),

  /** Fecha de última actualización del rol */
  updateAt: dateTime("updated_at")
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

export default role;
