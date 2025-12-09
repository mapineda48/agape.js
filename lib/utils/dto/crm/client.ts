import type DateTime from "../../data/DateTime";
import type { IUser, IPerson, ICompany } from "../core/user";

/**
 * DTO principal del Cliente con datos relacionados de Usuario, Persona y Empresa.
 */
export interface ClientDto {
  id: number;
  typeId: number | null;
  active: boolean;
  photo: string | null;
  user: {
    id: number;
    documentTypeId: number;
    documentNumber: string;
    email: string | null;
    phone: string | null;
    address: string | null;
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
}

/**
 * Resultado de buscar un cliente por ID (puede ser null/undefined).
 */
export type GetClientByIdResult = ClientDto | undefined;

/**
 * Elemento de la lista de clientes (aplanado para la tabla).
 */
export interface ClientListItem {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  legalName: string | null;
  tradeName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthdate: DateTime | null;
  typeId: number | null;
  typeName: string | null;
  photoUrl: string | null;
  active: boolean;
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
 * Payload para crear/actualizar Cliente.
 */
export interface UpsertClientPayload {
  id?: number;
  user: IUser;
  typeId: number;
  active?: boolean;
  photo?: string | File;
}

/**
 * Registro de cliente retornado tras creación/actualización.
 */
export interface ClientRecord {
  id: number;
  typeId: number | null;
  photoUrl: string | null;
  active: boolean;
  createdAt: DateTime;
  updatedAt: DateTime | null;
  user: IUser;
}
