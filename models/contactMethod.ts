import {
  serial,
  varchar,
  boolean,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  relations,
  sql,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { schema } from "./schema";
import { dateTime } from "../lib/db/custom-types";
import DateTime from "../lib/utils/data/DateTime";
import user from "./user";
import { contactMethodTypeEnum, type ContactMethodType } from "./enums";

/**
 * Modelo de Método de Contacto (ContactMethod)
 *
 * Representa los diferentes canales de comunicación asociados a una entidad.
 * Permite gestionar múltiples métodos de contacto por usuario/entidad,
 * tipificados y con indicador de preferencia.
 *
 * Este modelo reemplaza los campos planos email/phone en user,
 * permitiendo:
 * - Múltiples emails (personal, trabajo, facturación)
 * - Múltiples teléfonos (móvil, fijo, WhatsApp)
 * - Otros canales (redes sociales, mensajería)
 *
  */
export const contactMethod = schema.table(
  "contact_method",
  {
    /** Identificador único del método de contacto */
    id: serial("id").primaryKey(),

    /** FK al usuario/entidad dueño del contacto */
    userId: integer("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    /**
     * Tipo de método de contacto:
     * - email: Correo electrónico
     * - phone: Teléfono fijo
     * - mobile: Teléfono móvil
     * - whatsapp: WhatsApp
     * - telegram: Telegram
     * - fax: Fax
     * - other: Otro
     */
    type: contactMethodTypeEnum("contact_type").notNull(),

    /**
     * Valor del método de contacto.
     * El formato depende del tipo:
     * - email: correo@dominio.com
     * - phone/mobile/whatsapp: +XX XXX XXX XXXX
     * - etc.
     */
    value: varchar("value", { length: 255 }).notNull(),

    /**
     * Indica si es el método de contacto principal para el usuario.
     * Solo debe haber un método primario por tipo por usuario.
     */
    isPrimary: boolean("is_primary").notNull().default(false),

    /** Etiqueta descriptiva para identificar el contacto */
    label: varchar("label", { length: 100 }),

    /** Indica si el contacto está verificado */
    isVerified: boolean("is_verified").notNull().default(false),

    /** Indica si el contacto está activo/válido */
    isActive: boolean("is_active").notNull().default(true),

    /** Notas adicionales sobre el método de contacto */
    notes: varchar("notes", { length: 255 }),

    /** Fecha de creación del registro */
    createdAt: dateTime("created_at").default(sql`now()`),

    /** Fecha de última actualización del registro */
    updatedAt: dateTime("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    /**
     * Restricción de unicidad:
     * No puede haber valores duplicados del mismo tipo para el mismo usuario.
     * Por ejemplo, un usuario no puede tener el mismo email registrado dos veces.
     */
    uniqueIndex("ux_contact_method_unique").on(
      table.userId,
      table.type,
      table.value
    ),
  ]
);

// ============================================================================
// Relaciones
// ============================================================================

/**
 * Relaciones de ContactMethod:
 * - Cada método de contacto pertenece a un usuario
 */
export const contactMethodRelations = relations(contactMethod, ({ one }) => ({
  user: one(user, {
    fields: [contactMethod.userId],
    references: [user.id],
  }),
}));

// ============================================================================
// Types
// ============================================================================

export type ContactMethod = InferSelectModel<typeof contactMethod>;
export type NewContactMethod = InferInsertModel<typeof contactMethod>;

// Re-exportar tipos de enum
export { type ContactMethodType, CONTACT_METHOD_TYPE_VALUES } from "./enums";

export default contactMethod;
