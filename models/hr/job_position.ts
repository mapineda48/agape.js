import { serial, varchar, text, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { schema } from "../agape";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Modelo de Cargo (Job Position)
 *
 * Representa un cargo o puesto de trabajo dentro de la organización.
 * Esto es diferente de los roles de seguridad (security_role) que controlan
 * permisos de acceso al sistema.
 *
 * ## Ejemplos de cargos:
 * - Gerente de Ventas
 * - Contador
 * - Desarrollador Senior
 * - Recepcionista
 *
 * ## ¿Por qué separar cargo de rol de seguridad?
 * - Un "Gerente de Ventas" (cargo) puede o no tener permiso para crear facturas (security_role).
 * - Un "Desarrollador" (cargo) puede tener permisos de admin del sistema (security_role).
 * - Los cargos son de HR, los roles de seguridad son de IT/Sistema.
 */
const jobPosition = schema.table("hr_job_position", {
  /** Identificador único del cargo */
  id: serial("id").primaryKey(),

  /** Código corto del cargo (ej: GV001, DEV001) */
  code: varchar("code", { length: 20 }).notNull().unique(),

  /** Nombre del cargo (ej: Gerente de Ventas) */
  name: varchar("name", { length: 100 }).notNull(),

  /** Descripción detallada del cargo y responsabilidades */
  description: text("description"),

  /**
   * Nivel jerárquico del cargo (1 = más alto, mayor número = menor nivel).
   * Útil para organigramas y reportes de estructura organizacional.
   */
  level: serial("level"),

  /** Indica si el cargo está activo */
  isActive: boolean("is_active").default(true).notNull(),

  /** Fecha de creación del cargo */
  createdAt: dateTime("created_at")
    .default(sql`now()`)
    .notNull(),

  /** Fecha de última actualización del cargo */
  updatedAt: dateTime("updated_at")
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

export default jobPosition;
