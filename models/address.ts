/**
 * Modelo de Dirección (Address)
 *
 * Representa una dirección física en el sistema.
 * Este modelo permite gestionar múltiples direcciones por entidad,
 * siguiendo el patrón estándar de ERPs que requieren distinguir entre
 * direcciones de facturación, envío, oficina principal, sucursales, etc.
 */
import type {
  Generated,
  CreatedAt,
  UpdatedAt,
  Selectable,
  Insertable,
  Updateable,
} from "./types";
import type { AddressType } from "./enums";

export interface AddressTable {
  /** Identificador único de la dirección */
  id: Generated<number>;

  /** Línea principal de la dirección (calle, número, etc.) */
  street: string;

  /** Línea adicional de la dirección (apartamento, suite, edificio, etc.) */
  streetLine2: string | null;

  /** Ciudad */
  city: string;

  /** Estado, departamento o provincia */
  state: string | null;

  /** Código postal o ZIP code */
  zipCode: string | null;

  /**
   * Código ISO 3166-1 alpha-2 del país (ej: CO, US, ES, MX)
   * @see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
   */
  countryCode: string;

  /** Referencia o punto de referencia para ubicar la dirección */
  reference: string | null;

  /** Notas adicionales sobre la dirección */
  notes: string | null;

  /** Indica si la dirección está activa/válida */
  isActive: boolean;

  /** Fecha de creación del registro */
  createdAt: CreatedAt;

  /** Fecha de última actualización del registro */
  updatedAt: UpdatedAt;
}

/**
 * Tabla pivote para asociar direcciones a usuarios/entidades
 *
 * Implementa la relación muchos-a-muchos entre user y address,
 * permitiendo que una entidad tenga múltiples direcciones tipificadas
 * (facturación, envío, principal, sucursal, etc.).
 */
export interface UserAddressTable {
  /** Identificador único del registro */
  id: Generated<number>;

  /** FK al usuario/entidad */
  userId: number;

  /** FK a la dirección */
  addressId: number;

  /**
   * Tipo de dirección:
   * - billing: Facturación
   * - shipping: Envío
   * - main: Principal/Sede
   * - branch: Sucursal
   * - other: Otro
   */
  type: AddressType;

  /** Indica si es la dirección principal de este tipo para el usuario */
  isDefault: boolean;

  /** Etiqueta personalizada para identificar la dirección */
  label: string | null;

  /** Fecha de creación del registro */
  createdAt: CreatedAt;
}

// Types para Address
export type Address = Selectable<AddressTable>;
export type NewAddress = Insertable<AddressTable>;
export type AddressUpdate = Updateable<AddressTable>;

// Types para UserAddress
export type UserAddress = Selectable<UserAddressTable>;
export type NewUserAddress = Insertable<UserAddressTable>;
export type UserAddressUpdate = Updateable<UserAddressTable>;

// Re-exportar tipos de enum
export { type AddressType, ADDRESS_TYPE_VALUES } from "./enums";
