import type DateTime from "../../data/DateTime";

/**
 * Tipos de dirección disponibles en el sistema.
 */
export type AddressType = "billing" | "shipping" | "main" | "branch" | "other";

/**
 * Valores válidos para validación en runtime.
 */
export const ADDRESS_TYPE_VALUES: readonly AddressType[] = [
  "billing",
  "shipping",
  "main",
  "branch",
  "other",
];

/**
 * DTO para crear/actualizar una dirección física.
 */
export interface IAddress {
  /** ID de la dirección (solo para updates) */
  id?: number;

  /** Línea principal de la dirección (calle, número, etc.) */
  street: string;

  /** Línea adicional de la dirección (apartamento, suite, edificio, etc.) */
  streetLine2?: string | null;

  /** Ciudad */
  city: string;

  /** Estado, departamento o provincia */
  state?: string | null;

  /** Código postal o ZIP code */
  zipCode?: string | null;

  /** Código ISO 3166-1 alpha-2 del país (ej: CO, US, ES, MX) */
  countryCode: string;

  /** Referencia o punto de referencia para ubicar la dirección */
  reference?: string | null;

  /** Notas adicionales sobre la dirección */
  notes?: string | null;

  /** Indica si la dirección está activa/válida */
  isActive?: boolean;
}

/**
 * DTO para asociar una dirección a un usuario.
 */
export interface IUserAddress {
  /** ID del registro (solo para updates) */
  id?: number;

  /** ID del usuario */
  userId: number;

  /** ID de la dirección */
  addressId: number;

  /** Tipo de dirección */
  type: AddressType;

  /** Indica si es la dirección principal de este tipo para el usuario */
  isDefault?: boolean;

  /** Etiqueta personalizada para identificar la dirección */
  label?: string | null;
}

/**
 * DTO completo para crear dirección + asociación en una sola operación.
 * Usado para simplificar la creación desde el frontend.
 */
export interface IUpsertUserAddress {
  /** ID del usuario */
  userId: number;

  /** Tipo de dirección */
  type: AddressType;

  /** Indica si es la dirección principal de este tipo */
  isDefault?: boolean;

  /** Etiqueta personalizada */
  label?: string | null;

  /** Datos de la dirección física */
  address: IAddress;
}

/**
 * Dirección completa con su asociación al usuario.
 * Resultado de las operaciones de consulta.
 */
export interface IUserAddressRecord {
  /** ID del registro de asociación */
  id: number;

  /** ID del usuario */
  userId: number;

  /** Tipo de dirección */
  type: AddressType;

  /** Indica si es la dirección principal */
  isDefault: boolean;

  /** Etiqueta personalizada */
  label: string | null;

  /** Fecha de creación */
  createdAt: DateTime | null;

  /** Datos de la dirección física */
  address: {
    id: number;
    street: string;
    streetLine2: string | null;
    city: string;
    state: string | null;
    zipCode: string | null;
    countryCode: string;
    reference: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: DateTime | null;
    updatedAt: DateTime | null;
  };
}

/**
 * Parámetros para listar direcciones de un usuario.
 */
export interface ListUserAddressesParams {
  /** ID del usuario */
  userId: number;

  /** Filtrar por tipo de dirección */
  type?: AddressType;

  /** Filtrar solo activas */
  isActive?: boolean;
}
