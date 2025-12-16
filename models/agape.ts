import { text, jsonb, type PgSchema } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { dateTime } from "../lib/db/custom-types";
import DateTime from "../lib/utils/data/DateTime";
import schema from "./schema";

/**
 * Modelo Agape
 * Representa una entidad clave-valor genérica para configuraciones o datos globales.
 */
export const agape = schema.table("agape", {
  /** Clave única de la entidad */
  key: text("key").primaryKey(),
  /** Valor en formato JSON */
  value: jsonb("value").notNull(),
  /** Fecha de creación */
  createdAt: dateTime("created_at").default(sql`now()`),
  /** Fecha de última actualización */
  updatedAt: dateTime("updated_at")
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});