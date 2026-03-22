import {
  serial,
  varchar,
  text,
  integer,
  boolean,
  uniqueIndex,
  smallint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { schema } from "../schema";
import user from "../user";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "@mapineda48/agape-rpc/data/DateTime";
import { securityUserRole } from "./role";

/**
 * Modelo de usuario de acceso al sistema (SecurityUser)
 * Representa las credenciales y estado de acceso de un usuario.
 *
 * ## Relación con User:
 * - Relación 1:1 con user: cada usuario puede tener máximo un usuario de acceso.
 * - Si necesitas multi-login por usuario, elimina el uniqueIndex sobre userId.
 *
 * ## Mejoras de seguridad aplicadas (auditoría):
 * - Campos para control de intentos fallidos de login
 * - Preparación para 2FA (Two-Factor Authentication)
 * - Expiración de contraseña
 * - Token de reset de contraseña
 *
 * ## Recomendaciones de implementación (servicio):
 * - Usar bcrypt o argon2 para hash de contraseña
 * - Salt único por usuario (bcrypt lo maneja automáticamente)
 * - Implementar rate limiting a nivel de servicio
 */
export const securityUser = schema.table(
  "security_user",
  {
    /** Identificador único del usuario de acceso */
    id: serial("id").primaryKey(),

    /** Identificador del usuario relacionado (único para relación 1:1) */
    userId: integer("user_id")
      .notNull()
      .references(() => user.id),

    /** Nombre de usuario (único en el sistema) */
    username: varchar("username", { length: 64 }).notNull().unique(),

    /**
     * Hash de la contraseña.
     * IMPORTANTE: En el servicio usar bcrypt/argon2 con salt único.
     * Nunca almacenar contraseña en texto plano.
     */
    passwordHash: text("password_hash").notNull(),

    // ========================================================================
    // Campos de control de acceso
    // ========================================================================

    /** Indica si el usuario está activo */
    isActive: boolean("is_active").default(true).notNull(),

    /** Indica si el usuario está bloqueado (por intentos fallidos o admin) */
    isLocked: boolean("is_locked").default(false).notNull(),

    /**
     * Razón del bloqueo (si está bloqueado).
     * Ej: "Demasiados intentos fallidos", "Bloqueado por administrador"
     */
    lockReason: varchar("lock_reason", { length: 255 }),

    /** Fecha y hora hasta la cual el usuario está bloqueado (bloqueo temporal) */
    lockedUntil: dateTime("locked_until"),

    // ========================================================================
    // Control de intentos de login
    // ========================================================================

    /**
     * Número de intentos fallidos de login consecutivos.
     * Se resetea a 0 después de un login exitoso.
     * Típicamente bloquear después de 5 intentos.
     */
    failedLoginAttempts: smallint("failed_login_attempts").default(0).notNull(),

    /** Fecha y hora del último intento fallido de login */
    lastFailedLogin: dateTime("last_failed_login"),

    // ========================================================================
    // Control de contraseña
    // ========================================================================

    /**
     * Fecha de la última vez que se cambió la contraseña.
     * Útil para políticas de expiración de contraseña.
     */
    passwordChangedAt: dateTime("password_changed_at").default(sql`now()`),

    /**
     * Indica si el usuario debe cambiar la contraseña en el próximo login.
     * Útil para contraseñas temporales o reset forzado.
     */
    mustChangePassword: boolean("must_change_password")
      .default(false)
      .notNull(),

    /**
     * Token para reset de contraseña (único y temporal).
     * NULL si no hay solicitud de reset activa.
     * El token debe tener expiración corta (típicamente 1 hora).
     */
    passwordResetToken: varchar("password_reset_token", { length: 255 }),

    /** Fecha de expiración del token de reset de contraseña */
    passwordResetExpires: dateTime("password_reset_expires"),

    // ========================================================================
    // Preparación para 2FA (Two-Factor Authentication)
    // ========================================================================

    /**
     * Indica si el usuario tiene 2FA habilitado.
     * Si es true, requiere código TOTP además de contraseña.
     */
    twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),

    /**
     * Secreto para TOTP (Time-based One-Time Password).
     * Encriptado o almacenado de forma segura.
     * NULL si 2FA no está configurado.
     */
    twoFactorSecret: varchar("two_factor_secret", { length: 255 }),

    /**
     * Códigos de recuperación para 2FA (backup codes).
     * Array de códigos hasheados para usar si el usuario pierde su dispositivo.
     * Almacenados como texto (JSON array) encriptado.
     */
    twoFactorBackupCodes: text("two_factor_backup_codes"),

    // ========================================================================
    // Auditoría de acceso
    // ========================================================================

    /** Fecha y hora del último acceso exitoso */
    lastLogin: dateTime("last_login"),

    /** IP del último acceso exitoso */
    lastLoginIp: varchar("last_login_ip", { length: 45 }),

    /** Número total de logins exitosos (estadística) */
    loginCount: integer("login_count").default(0).notNull(),

    // ========================================================================
    // Timestamps estándar
    // ========================================================================

    /** Fecha de creación del usuario */
    createdAt: dateTime("created_at")
      .default(sql`now()`)
      .notNull(),

    /** Fecha de última actualización */
    updatedAt: dateTime("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    /**
     * Restricción de unicidad: un usuario solo puede tener un usuario de acceso.
     * Esto implementa la relación 1:1 User ↔ SecurityUser.
     */
    uniqueIndex("ux_security_user_user_id").on(table.userId),
  ],
);

/**
 * Relaciones de SecurityUser:
 * - Cada usuario pertenece a exactamente un usuario
 * - Un usuario puede tener múltiples roles de seguridad
 */
export const securityUserRelations = relations(
  securityUser,
  ({ one, many }) => ({
    user: one(user, {
      fields: [securityUser.userId],
      references: [user.id],
    }),
    /** Roles de seguridad asignados al usuario */
    roles: many(securityUserRole),
  }),
);

export default securityUser;
