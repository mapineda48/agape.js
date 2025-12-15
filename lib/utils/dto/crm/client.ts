import type Decimal from "../../data/Decimal";
import type DateTime from "../../data/DateTime";
import type { IUser, IPerson, ICompany } from "../core/user";
import type { IClientContactInfo } from "../core/contactMethod";
import type { IAddress, AddressType } from "../core/address";

/**
 * DTO principal del Cliente con datos relacionados de Usuario, Persona y Empresa.
 */
export interface ClientDto {
  id: number;
  typeId: number | null;
  active: boolean;
  photo: string | null;
  clientCode: string | null;
  user: {
    id: number;
    documentTypeId: number;
    documentNumber: string;
    countryCode: string | null;
    languageCode: string | null;
    currencyCode: string | null;
  };
  person: {
    firstName: string;
    lastName: string;
    birthdate: DateTime | null;
  } | null;
  company: {
    legalName: string;
    tradeName: string | null;
  } | null;
  // Campos comerciales ERP
  priceListId: number | null;
  paymentTermsId: number | null;
  creditLimit: Decimal | null;
  creditDays: number | null;
  salespersonId: number | null;
  // Información de contacto
  contacts?: IClientContactInfo;
}

/**
 * Resultado de buscar un cliente por ID (puede ser null/undefined).
 */
export type GetClientByIdResult = ClientDto | undefined;

/**
 * Elemento de la lista de clientes (aplanado para la tabla).
 *
 * Incluye campos comerciales para visualización en listados.
 */
export interface ClientListItem {
  id: number;
  userId: number;
  clientCode: string | null;
  firstName: string | null;
  lastName: string | null;
  legalName: string | null;
  tradeName: string | null;
  birthdate: DateTime | null;
  typeId: number | null;
  typeName: string | null;
  photoUrl: string | null;
  active: boolean;
  documentNumber: string;
  // Campos comerciales
  priceListId: number | null;
  priceListName: string | null;
  paymentTermsId: number | null;
  paymentTermsName: string | null;
  creditLimit: Decimal | null;
  creditDays: number | null;
  salespersonId: number | null;
  salespersonName: string | null;
  // Contacto principal (para mostrar en lista)
  primaryEmail: string | null;
  primaryPhone: string | null;
  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime | null;
}

/**
 * Parámetros para listar clientes.
 */
export interface ListClientsParams {
  fullName?: string;
  isActive?: boolean;
  typeId?: number;
  salespersonId?: number;
  priceListId?: number;
  includeTotalCount?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

/**
 * Resultado de listar clientes.
 */
export interface ListClientsResult {
  clients: ClientListItem[];
  totalCount?: number;
}

/**
 * Información de dirección simplificada para el payload.
 */
export interface IClientAddress {
  /** ID de la dirección (para updates) */
  id?: number;
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
 * Payload para crear/actualizar Cliente.
 *
 * Incluye campos comerciales estándar de ERP:
 * - priceListId: Lista de precios asignada
 * - paymentTermsId: Condiciones de pago por defecto
 * - creditLimit: Límite de crédito
 * - creditDays: Días de crédito
 * - salespersonId: Vendedor asignado
 * - contacts: Información de contacto (email, teléfono, móvil)
 * - addresses: Direcciones (facturación, envío)
 */
export interface UpsertClientPayload {
  id?: number;
  user: IUser;
  typeId: number;
  active?: boolean;
  photo?: string | File;
  /** Código interno del cliente */
  clientCode?: string | null;
  // Campos comerciales ERP
  /** Lista de precios asignada al cliente */
  priceListId?: number | null;
  /** Condiciones de pago por defecto */
  paymentTermsId?: number | null;
  /** Límite de crédito máximo */
  creditLimit?: Decimal | number | string | null;
  /** Días de crédito por defecto */
  creditDays?: number | null;
  /** Vendedor/representante asignado */
  salespersonId?: number | null;
  // Información de contacto simplificada
  /** Métodos de contacto principales */
  contacts?: IClientContactInfo;
  // Direcciones
  /** Direcciones del cliente (facturación, envío) */
  addresses?: IClientAddress[];
}

/**
 * Registro de cliente retornado tras creación/actualización.
 */
export interface ClientRecord {
  id: number;
  typeId: number | null;
  photoUrl: string | null;
  active: boolean;
  clientCode: string | null;
  // Campos comerciales
  priceListId: number | null;
  paymentTermsId: number | null;
  creditLimit: Decimal | null;
  creditDays: number | null;
  salespersonId: number | null;
  // Timestamps
  createdAt: DateTime;
  updatedAt: DateTime | null;
  user: IUser;
}

/**
 * Resultado de búsqueda por documento.
 */
export type GetClientByDocumentResult = ClientDto | null;
