/**
 * DTOs para tipos de cliente.
 * @module crm/clientType
 */

/**
 * Tipo de cliente (entidad de solo lectura para dropdowns).
 */
export interface ClientType {
  id: number;
  name: string;
  isEnabled: boolean;
}

/**
 * Payload para crear/actualizar tipos de cliente.
 */
export interface NewClientType {
  id?: number;
  name: string;
  isEnabled?: boolean;
}

/**
 * Alias para compatibilidad.
 */
export type IClientType = ClientType;
export type IUpsertClientType = NewClientType;

/**
 * DTO para toggle (habilitar/deshabilitar) un tipo de cliente.
 */
export interface IToggleClientType {
  /** ID del tipo de cliente */
  id: number;
  /** Nuevo estado de habilitación */
  isEnabled: boolean;
}

/**
 * Resultado de la operación toggle.
 */
export interface IToggleClientTypeResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Tipo de cliente actualizado */
  clientType: ClientType;
  /** Mensaje informativo */
  message?: string;
}

/**
 * Filtros para listar tipos de cliente.
 */
export interface IListClientTypesParams {
  /** Si es true, retorna solo los activos */
  activeOnly?: boolean;
}
