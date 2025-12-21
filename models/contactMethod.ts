/**
 * Modelo de Método de Contacto (ContactMethod)
 *
 * Representa los diferentes canales de comunicación asociados a una entidad.
 * Permite gestionar múltiples métodos de contacto por usuario/entidad,
 * tipificados y con indicador de preferencia.
 *
 * Este modelo permite:
 * - Múltiples emails (personal, trabajo, facturación)
 * - Múltiples teléfonos (móvil, fijo, WhatsApp)
 * - Otros canales (redes sociales, mensajería)
 */
import type {
  Generated,
  CreatedAt,
  UpdatedAt,
  Selectable,
  Insertable,
  Updateable,
} from "./types";
import type { ContactMethodType } from "./enums";

export interface ContactMethodTable {
  /** Identificador único del método de contacto */
  id: Generated<number>;

  /** FK al usuario/entidad dueño del contacto */
  userId: number;

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
  type: ContactMethodType;

  /**
   * Valor del método de contacto.
   * El formato depende del tipo:
   * - email: correo@dominio.com
   * - phone/mobile/whatsapp: +XX XXX XXX XXXX
   * - etc.
   */
  value: string;

  /**
   * Indica si es el método de contacto principal para el usuario.
   * Solo debe haber un método primario por tipo por usuario.
   */
  isPrimary: boolean;

  /** Etiqueta descriptiva para identificar el contacto */
  label: string | null;

  /** Indica si el contacto está verificado */
  isVerified: boolean;

  /** Indica si el contacto está activo/válido */
  isActive: boolean;

  /** Notas adicionales sobre el método de contacto */
  notes: string | null;

  /** Fecha de creación del registro */
  createdAt: CreatedAt;

  /** Fecha de última actualización del registro */
  updatedAt: UpdatedAt;
}

export type ContactMethod = Selectable<ContactMethodTable>;
export type NewContactMethod = Insertable<ContactMethodTable>;
export type ContactMethodUpdate = Updateable<ContactMethodTable>;

// Re-exportar tipos de enum
export { type ContactMethodType, CONTACT_METHOD_TYPE_VALUES } from "./enums";
