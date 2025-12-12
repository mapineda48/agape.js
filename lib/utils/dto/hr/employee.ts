import type DateTime from "../../data/DateTime";
import type { IUser, IUserRecord } from "../core/user";

/**
 * Parámetros para listar empleados con filtros y paginación.
 */
export interface ListEmployeesParams {
  /** Filtro por nombre completo (búsqueda parcial) */
  fullName?: string;
  /** Filtro por estado activo/inactivo */
  isActive?: boolean;
  /** Si es true, incluye el conteo total de registros */
  includeTotalCount?: boolean;
  /** Índice de página (0-based) */
  pageIndex?: number;
  /** Tamaño de página */
  pageSize?: number;
}

/**
 * Resultado del listado de empleados.
 */
export interface ListEmployeesResult {
  employees: EmployeeListItem[];
  totalCount?: number;
}

/**
 * Ítem de empleado en el resultado de listado.
 */
export interface EmployeeListItem {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  birthdate: DateTime | null;
  hireDate: DateTime;
  isActive: boolean;
  avatarUrl: string | null;
  documentNumber: string;
  createdAt: DateTime;
  updatedAt: DateTime | null;
}

/**
 * DTO para crear o actualizar un empleado.
 * Incluye los datos de usuario anidados.
 */
export interface UpsertEmployeePayload {
  /** ID del empleado (solo para updates) */
  id?: number;
  /** Datos del usuario (persona) - los empleados solo pueden ser personas */
  user: IUser;
  /** Estado activo del empleado */
  isActive?: boolean;
  /** Fecha de contratación */
  hireDate?: Date | DateTime;
  /** Metadatos adicionales */
  metadata?: unknown;
  /** Avatar (URL existente o File para subir) */
  avatar?: string | File;
}

/**
 * Registro de empleado retornado por upsertEmployee.
 */
export interface EmployeeRecord {
  id: number;
  hireDate: DateTime;
  isActive: boolean;
  avatarUrl: string | null;
  metadata: unknown;
  createdAt: DateTime;
  updatedAt: DateTime | null;
  user: IUserRecord;
}

/**
 * Empleado obtenido por getEmployeeById.
 * Incluye datos aplanados de persona y usuario.
 *
 * NOTA: Los campos de contacto (email, phone, address) fueron migrados a
 * core_contact_method y core_user_address.
 */
export interface EmployeeDetails {
  id: number;
  userId: number;
  firstName: string | null;
  lastName: string | null;
  birthdate: DateTime | null;
  hireDate: DateTime;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: DateTime;
  updatedAt: DateTime | null;
  documentTypeId: number;
  documentNumber: string;
  /** Código ISO 3166-1 alpha-2 del país */
  countryCode: string | null;
  /** Código ISO 639-1 del idioma */
  languageCode: string | null;
  /** Código ISO 4217 de la moneda */
  currencyCode: string | null;
}
