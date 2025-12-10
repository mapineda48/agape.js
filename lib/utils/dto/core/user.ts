import type DateTime from "../../data/DateTime";

/**
 * Tipos de usuario en el sistema.
 * - `person`: Persona natural
 * - `company`: Persona jurídica
 */
export type UserType = "person" | "company";

/**
 * Valores válidos para UserType (validación runtime).
 */
export const USER_TYPE_VALUES: readonly UserType[] = ["person", "company"];

/**
 * Datos de una persona natural.
 */
export interface IPerson {
  /** Nombre */
  firstName: string;
  /** Apellido */
  lastName: string;
  /** Fecha de nacimiento (opcional) */
  birthdate?: DateTime | Date | null;
}

/**
 * Datos de una persona jurídica (empresa).
 */
export interface ICompany {
  /** Razón social */
  legalName: string;
  /** Nombre comercial (opcional) */
  tradeName?: string | null;
}

/**
 * Campos base de un usuario (sin tipo, se infiere).
 *
 */
export interface IUserBase {
  /** ID del usuario (solo para updates) */
  id?: number;
  /** ID del tipo de documento */
  documentTypeId: number;
  /** Número de documento */
  documentNumber: string;
  /** Código ISO 3166-1 alpha-2 del país (ej: CO, US, ES, MX) */
  countryCode?: string | null;
  /** Código ISO 639-1 del idioma preferido (ej: es, en, pt) */
  languageCode?: string | null;
  /** Código ISO 4217 de la moneda preferida (ej: COP, USD, EUR) */
  currencyCode?: string | null;
  /** Indica si el usuario está activo */
  isActive?: boolean;
}

/**
 * DTO para usuario de tipo persona.
 * Garantiza exclusión mutua con company.
 */
export interface IUserPerson extends IUserBase {
  /** Datos de persona */
  person: IPerson;
  /** No puede tener datos de empresa */
  company?: never;
}

/**
 * DTO para usuario de tipo empresa.
 * Garantiza exclusión mutua con person.
 */
export interface IUserCompany extends IUserBase {
  /** Datos de empresa */
  company: ICompany;
  /** No puede tener datos de persona */
  person?: never;
}

/**
 * DTO general para crear/actualizar un usuario.
 * Debe incluir person O company (no ambos).
 */
export type IUser = IUserPerson | IUserCompany;

/**
 * Registro de usuario leído de la BD.
 */
export interface IUserRecord extends IUserBase {
  id: number;
  type: UserType;
  createdAt: DateTime;
  updatedAt: DateTime | null;
}

/**
 * Resultado de getUserByDocument con datos relacionados.
 */
export interface IUserWithDetails extends IUserRecord {
  person?: IPerson;
  company?: ICompany;
}
