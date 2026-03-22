import { text, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { dateTime } from "../lib/db/custom-types";
import DateTime from "@mapineda48/agape-rpc/data/DateTime";
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
  createdAt: dateTime("created_at").notNull().default(sql`now()`),
  /** Fecha de última actualización */
  updatedAt: dateTime("updated_at")
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});
