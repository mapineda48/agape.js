import type DateTime from "../../data/DateTime";
import type { IUser, IUserRecord } from "../core/user";

/**
 * Parámetros para listar proveedores con filtros y paginación.
 */
export interface ListSuppliersParams {
  /** Filtro por nombre completo (búsqueda parcial) */
  fullName?: string;
  /** Filtro por estado activo/inactivo */
  isActive?: boolean;
  /** Filtro por tipo de proveedor */
  supplierTypeId?: number;
  /** Si es true, incluye el conteo total de registros */
  includeTotalCount?: boolean;
  /** Índice de página (0-based) */
  pageIndex?: number;
  /** Tamaño de página */
  pageSize?: number;
}

/**
 * Resultado del listado de proveedores.
 */
export interface ListSuppliersResult {
  suppliers: SupplierListItem[];
  totalCount?: number;
}

/**
 * Ítem de proveedor en el resultado de listado.
 */
export interface SupplierListItem {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  legalName: string | null;
  tradeName: string | null;
  birthdate: DateTime | null;
  supplierTypeId: number;
  supplierTypeName: string | null;
  registrationDate: DateTime;
  active: boolean;
  documentTypeId: number;
  documentNumber: string;
}

/**
 * DTO para crear o actualizar un proveedor.
 * Incluye los datos de usuario anidados.
 */
export interface UpsertSupplierPayload {
  /** ID del proveedor (solo para updates) */
  id?: number;
  /** Datos del usuario (persona o empresa) */
  user: IUser;
  /** ID del tipo de proveedor */
  supplierTypeId: number;
  /** Estado activo del proveedor */
  active?: boolean;
}

/**
 * Registro de proveedor retornado por upsertSupplier.
 */
export interface SupplierRecord {
  id: number;
  supplierTypeId: number;
  registrationDate: DateTime;
  active: boolean;
  user: IUserRecord;
}

/**
 * Proveedor obtenido por getSupplierById.
 * Incluye datos aplanados de persona/empresa y usuario.
 *
 * NOTA: Los campos de contacto (email, phone, address) fueron migrados a
 * core_contact_method y core_user_address.
 */
export interface SupplierDetails {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  legalName: string | null;
  tradeName: string | null;
  birthdate: DateTime | null;
  supplierTypeId: number;
  supplierTypeName: string | null;
  registrationDate: DateTime;
  active: boolean;
  documentTypeId: number;
  documentNumber: string;
}
