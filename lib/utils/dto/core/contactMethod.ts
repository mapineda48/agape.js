import type DateTime from "../../data/DateTime";

/**
 * Tipos de método de contacto disponibles en el sistema.
 */
export type ContactMethodType =
  | "email"
  | "phone"
  | "mobile"
  | "whatsapp"
  | "telegram"
  | "fax"
  | "other";

/**
 * Valores válidos para validación en runtime.
 */
export const CONTACT_METHOD_TYPE_VALUES: readonly ContactMethodType[] = [
  "email",
  "phone",
  "mobile",
  "whatsapp",
  "telegram",
  "fax",
  "other",
];

/**
 * DTO para crear/actualizar un método de contacto.
 */
export interface IContactMethod {
  /** ID del método de contacto (solo para updates) */
  id?: number;

  /** ID del usuario al que pertenece */
  userId: number;

  /** Tipo de método de contacto */
  type: ContactMethodType;

  /** Valor del contacto (email, teléfono, etc.) */
  value: string;

  /** Indica si es el método principal de este tipo */
  isPrimary?: boolean;

  /** Etiqueta descriptiva (ej: "Personal", "Trabajo") */
  label?: string | null;

  /** Indica si el contacto está verificado */
  isVerified?: boolean;

  /** Indica si el contacto está activo */
  isActive?: boolean;

  /** Notas adicionales */
  notes?: string | null;
}

/**
 * Registro de método de contacto desde la BD.
 */
export interface IContactMethodRecord {
  id: number;
  userId: number;
  type: ContactMethodType;
  value: string;
  isPrimary: boolean;
  label: string | null;
  isVerified: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: DateTime | null;
  updatedAt: DateTime | null;
}

/**
 * Parámetros para listar métodos de contacto de un usuario.
 */
export interface ListContactMethodsParams {
  /** ID del usuario */
  userId: number;

  /** Filtrar por tipo de contacto */
  type?: ContactMethodType;

  /** Filtrar solo activos */
  isActive?: boolean;

  /** Filtrar solo primarios */
  isPrimary?: boolean;
}

/**
 * DTO simplificado para contactos en el formulario de cliente.
 * Agrupa los contactos más comunes en campos directos.
 */
export interface IClientContactInfo {
  /** Email principal */
  email?: string;
  /** Teléfono fijo */
  phone?: string;
  /** Teléfono móvil */
  mobile?: string;
  /** WhatsApp (si es diferente al móvil) */
  whatsapp?: string;
}
