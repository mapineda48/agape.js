import { schema } from "../schema";
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
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import documentType from "./documentType";
import person from "./person";
import company from "./company";
import { userTypeEnum, type UserType } from "./enums";
import { userAddress } from "./address";
import contactMethod from "./contactMethod";

/**
 * User (entidad genérica)
 * Representa una entidad que puede ser persona o empresa.
 * Centraliza la identidad y los datos de contacto básicos.
 *
 * Implementa el patrón Class Table Inheritance donde `user` es la tabla
 * maestra y `person`/`company` son tablas de detalle especializadas.
 *
 * ## Relaciones con otros modelos
 *
 * - **Direcciones**: Un user puede tener múltiples direcciones a través
 *   de `core_user_address`. Ver `./address.ts`.
 *
 * - **Métodos de contacto**: Un user puede tener múltiples métodos de
 *   contacto (emails, teléfonos, WhatsApp, etc.) a través de
 *   `core_contact_method`. Ver `./contactMethod.ts`.
 *
 * ## Campos legacy
 *
 * Los campos `email`, `phone` y `address` se mantienen por compatibilidad
 * hacia atrás, pero se recomienda usar los modelos de `contactMethod` y
 * `userAddress` para nuevas implementaciones.
 */
export const user = schema.table(
  "user",
  {
    /** Identificador único de la entidad */
    id: serial("id").primaryKey(),

    /**
     * Tipo de entidad: "person" | "company"
     * Determina qué tabla de detalle contiene la información específica.
     */
    type: userTypeEnum("user_type").notNull(),

    /** Tipo de documento asociado */
    documentTypeId: integer("document_type_id")
      .notNull()
      .references(() => documentType.id, { onDelete: "restrict" }),

    /** Número del documento de identificación */
    documentNumber: varchar("document_number", { length: 30 }).notNull(),

    // ========================================================================
    // Campos de internacionalización
    // ========================================================================

    /**
     * Código ISO 3166-1 alpha-2 del país (ej: CO, US, ES, MX)
     * @see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
     */
    countryCode: varchar("country_code", { length: 2 }),

    /**
     * Código ISO 639-1 del idioma preferido (ej: es, en, pt)
     * @see https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
     */
    languageCode: varchar("language_code", { length: 2 }),

    /**
     * Código ISO 4217 de la moneda preferida (ej: COP, USD, EUR)
     * @see https://en.wikipedia.org/wiki/ISO_4217
     */
    currencyCode: varchar("currency_code", { length: 3 }),

    // ========================================================================
    // Campos de control
    // ========================================================================

    /** Indica si la entidad está activa en el sistema */
    isActive: boolean("is_active").notNull().default(true),

    /** Fecha de creación del registro */
    createdAt: dateTime("created_at").default(sql`now()`),

    /** Fecha de última actualización del registro */
    updatedAt: dateTime("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    /**
     * Restricción de unicidad para evitar que exista más de una
     * entidad con el mismo tipo y número de documento.
     */
    uniqueIndex("ux_user_document").on(
      table.documentTypeId,
      table.documentNumber
    ),
  ]
);

/**
 * Relaciones de DocumentType:
 * - Un tipo de documento puede estar asociado a muchas parties.
 */
export const documentTypeRelations = relations(documentType, ({ many }) => ({
  users: many(user),
}));

/**
 * Relaciones de User:
 * - Cada user tiene exactamente un tipo de documento.
 * - Puede tener una persona asociada (si userType = person).
 * - Puede tener una empresa asociada (si userType = company).
 * - Puede tener múltiples direcciones asociadas.
 * - Puede tener múltiples métodos de contacto.
 */
export const userRelations = relations(user, ({ one, many }) => ({
  documentType: one(documentType, {
    fields: [user.documentTypeId],
    references: [documentType.id],
  }),
  person: one(person, {
    fields: [user.id],
    references: [person.id],
  }),
  company: one(company, {
    fields: [user.id],
    references: [company.id],
  }),
  /** Direcciones asociadas al usuario (via tabla pivote) */
  addresses: many(userAddress),
  /** Métodos de contacto del usuario */
  contactMethods: many(contactMethod),
}));

export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

// Re-exportar el enum de tipo de usuario para facilitar el acceso
export { type UserType, USER_TYPE_VALUES } from "./enums";

export default user;
