/**
 * Modelo User (entidad genérica)
 *
 * Representa una entidad que puede ser persona o empresa.
 * Centraliza la identidad y los datos de contacto básicos.
 *
 * Implementa el patrón Class Table Inheritance donde `user` es la tabla
 * maestra y `person`/`company` son tablas de detalle especializadas.
 *
 * ## Relaciones con otros modelos
 *
 * - **Direcciones**: Un user puede tener múltiples direcciones a través
 *   de `core_user_address`.
 *
 * - **Métodos de contacto**: Un user puede tener múltiples métodos de
 *   contacto (emails, teléfonos, WhatsApp, etc.) a través de
 *   `core_contact_method`.
 */
import type {
  Generated,
  CreatedAt,
  UpdatedAt,
  Selectable,
  Insertable,
  Updateable,
} from "./types";
import type { UserType } from "./enums";

export interface UserTable {
  /** Identificador único de la entidad */
  id: Generated<number>;

  /**
   * Tipo de entidad: "person" | "company"
   * Determina qué tabla de detalle contiene la información específica.
   */
  type: UserType;

  /** Tipo de documento asociado (FK a core_identity_document_type) */
  documentTypeId: number;

  /** Número del documento de identificación */
  documentNumber: string;

  /**
   * Código ISO 3166-1 alpha-2 del país (ej: CO, US, ES, MX)
   * @see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
   */
  countryCode: string | null;

  /**
   * Código ISO 639-1 del idioma preferido (ej: es, en, pt)
   * @see https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
   */
  languageCode: string | null;

  /**
   * Código ISO 4217 de la moneda preferida (ej: COP, USD, EUR)
   * @see https://en.wikipedia.org/wiki/ISO_4217
   */
  currencyCode: string | null;

  /** Indica si la entidad está activa en el sistema */
  isActive: boolean;

  /** Fecha de creación del registro */
  createdAt: CreatedAt;

  /** Fecha de última actualización del registro */
  updatedAt: UpdatedAt;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

// Re-exportar el enum de tipo de usuario para facilitar el acceso
export { type UserType, USER_TYPE_VALUES } from "./enums";
