/**
 * DTOs para Listas de Precios (Price List)
 * @module catalogs/price_list
 */

/**
 * DTO para crear/actualizar una lista de precios.
 */
export interface IUpsertPriceList {
  /** ID de la lista (si existe, es actualización) */
  id?: number;
  /** Código interno de la lista (único) */
  code: string;
  /** Nombre de la lista de precios */
  fullName: string;
  /** Descripción de la lista */
  description?: string | null;
  /** Indica si es la lista por defecto */
  isDefault?: boolean;
  /** Indica si la lista está habilitada */
  isEnabled?: boolean;
}

/**
 * Resultado de una lista de precios.
 */
export interface IPriceList {
  /** Identificador único de la lista */
  id: number;
  /** Código interno de la lista */
  code: string;
  /** Nombre de la lista */
  fullName: string;
  /** Descripción de la lista */
  description: string | null;
  /** Indica si es la lista por defecto */
  isDefault: boolean;
  /** Indica si la lista está habilitada */
  isEnabled: boolean;
}

/**
 * DTO para toggle (habilitar/deshabilitar) una lista de precios.
 */
export interface ITogglePriceList {
  /** ID de la lista */
  id: number;
  /** Nuevo estado de habilitación */
  isEnabled: boolean;
}

/**
 * Resultado de la operación toggle.
 */
export interface ITogglePriceListResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Lista actualizada */
  priceList: IPriceList;
  /** Mensaje informativo */
  message?: string;
}

/**
 * DTO para establecer una lista como default.
 */
export interface ISetDefaultPriceList {
  /** ID de la lista a marcar como default */
  id: number;
}

/**
 * Resultado de la operación setDefault.
 */
export interface ISetDefaultPriceListResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Nueva lista default */
  priceList: IPriceList;
  /** Lista anterior que era default (si había) */
  previousDefault?: IPriceList;
  /** Mensaje informativo */
  message?: string;
}

/**
 * Información de uso de una lista de precios.
 */
export interface IPriceListUsageInfo {
  /** Número de ítems con precio en esta lista */
  itemsWithPriceCount: number;
  /** Número de clientes con esta lista asignada */
  clientsCount: number;
  /** Indica si es la lista default */
  isDefault: boolean;
  /** Indica si la lista puede ser deshabilitada */
  canDisable: boolean;
  /** Razón por la que no puede deshabilitarse */
  reason?: string;
}

/**
 * Filtros para listar listas de precios.
 */
export interface IListPriceListsParams {
  /** Si es true, retorna solo las activas */
  activeOnly?: boolean;
  /** Incluir información de uso */
  includeUsageInfo?: boolean;
}

/**
 * Lista de precios con información de uso.
 */
export interface IPriceListWithUsage extends IPriceList {
  /** Número de ítems con precio en esta lista */
  itemsCount?: number;
  /** Número de clientes con esta lista */
  clientsCount?: number;
}
