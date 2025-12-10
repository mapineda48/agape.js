import {
  serial,
  varchar,
  text,
  boolean,
  primaryKey,
  integer,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { schema } from "../agape";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import { securityUser } from "./user";

/**
 * Modelo de Rol de Seguridad (Security Role)
 *
 * Representa un rol de acceso al sistema con permisos específicos.
 * Esto es diferente de los cargos de HR (job_position) que representan
 * puestos de trabajo en la organización.
 *
 * ## Ejemplos de roles de seguridad:
 * - Admin: Acceso total al sistema
 * - Ventas: Puede crear cotizaciones y pedidos
 * - Facturación: Puede crear y anular facturas
 * - Inventario: Puede ver y modificar stock
 * - Solo Lectura: Usuario con acceso de consulta
 *
 * ## ¿Por qué separar de cargos de HR?
 * - Un "Gerente de Ventas" (cargo) puede necesitar rol "Admin" o solo "Ventas"
 * - Un "Contador" (cargo) puede necesitar roles "Facturación" + "Reportes"
 * - Los roles de seguridad son granulares y combinables
 */
const securityRole = schema.table("security_role", {
  /** Identificador único del rol */
  id: serial("id").primaryKey(),

  /** Código único del rol (ej: ADMIN, SALES, BILLING) */
  code: varchar("code", { length: 30 }).notNull().unique(),

  /** Nombre descriptivo del rol (ej: Administrador, Ventas, Facturación) */
  name: varchar("name", { length: 100 }).notNull(),

  /** Descripción detallada de los permisos que otorga el rol */
  description: text("description"),

  /**
   * Indica si es un rol de sistema (no editable por usuarios).
   * Los roles de sistema son creados por la aplicación y no deben
   * ser modificados ni eliminados por los usuarios.
   */
  isSystemRole: boolean("is_system_role").default(false).notNull(),

  /** Indica si el rol está activo */
  isActive: boolean("is_active").default(true).notNull(),

  /** Fecha de creación del rol */
  createdAt: dateTime("created_at")
    .default(sql`now()`)
    .notNull(),

  /** Fecha de última actualización del rol */
  updatedAt: dateTime("updated_at")
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
});

/**
 * Tabla pivote para relación many-to-many entre usuarios de seguridad y roles.
 * Un usuario puede tener múltiples roles de seguridad.
 * Un rol puede estar asignado a múltiples usuarios.
 */
export const securityUserRole = schema.table(
  "security_user_role",
  {
    /** ID del usuario de seguridad */
    userId: integer("user_id")
      .notNull()
      .references(() => securityUser.id, { onDelete: "cascade" }),

    /** ID del rol de seguridad */
    roleId: integer("role_id")
      .notNull()
      .references(() => securityRole.id, { onDelete: "cascade" }),

    /** Fecha de asignación del rol al usuario */
    assignedAt: dateTime("assigned_at")
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })]
);

/**
 * Relaciones del rol de seguridad
 */
export const securityRoleRelations = relations(securityRole, ({ many }) => ({
  /** Usuarios que tienen este rol */
  userRoles: many(securityUserRole),
}));

/**
 * Relaciones de la tabla pivote usuario-rol
 */
export const securityUserRoleRelations = relations(
  securityUserRole,
  ({ one }) => ({
    user: one(securityUser, {
      fields: [securityUserRole.userId],
      references: [securityUser.id],
    }),
    role: one(securityRole, {
      fields: [securityUserRole.roleId],
      references: [securityRole.id],
    }),
  })
);

export default securityRole;
