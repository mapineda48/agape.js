/**
 * DTOs para Monedas (Currency)
 * @module finance/currency
 */

import type Decimal from "../../data/Decimal";

/**
 * DTO para crear/actualizar una moneda.
 */
export interface IUpsertCurrency {
  /** ID de la moneda (si existe, es actualización) */
  id?: number;
  /** Código ISO 4217 de la moneda (ej: COP, USD) - se normaliza a mayúsculas */
  code: string;
  /** Nombre completo de la moneda */
  fullName: string;
  /** Símbolo de la moneda (ej: $, €) */
  symbol?: string;
  /** Tasa de cambio respecto a la moneda base */
  exchangeRate?: Decimal;
  /** Indica si la moneda está habilitada */
  isEnabled?: boolean;
}

/**
 * Resultado de una moneda.
 */
export interface ICurrency {
  /** Identificador único de la moneda */
  id: number;
  /** Código ISO 4217 de la moneda */
  code: string;
  /** Nombre completo de la moneda */
  fullName: string;
  /** Símbolo de la moneda */
  symbol: string;
  /** Tasa de cambio respecto a la moneda base */
  exchangeRate: Decimal;
  /** Indica si es la moneda base del sistema */
  isBase: boolean;
  /** Indica si la moneda está habilitada */
  isEnabled: boolean;
}

/**
 * DTO para toggle (habilitar/deshabilitar) una moneda.
 */
export interface IToggleCurrency {
  /** ID de la moneda */
  id: number;
  /** Nuevo estado de habilitación */
  isEnabled: boolean;
}

/**
 * Resultado de la operación toggle de moneda.
 */
export interface IToggleCurrencyResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Moneda actualizada */
  currency: ICurrency;
  /** Mensaje informativo */
  message?: string;
}

/**
 * DTO para establecer la moneda base.
 */
export interface ISetBaseCurrency {
  /** ID de la moneda a establecer como base */
  id: number;
}

/**
 * Resultado de establecer moneda base.
 */
export interface ISetBaseCurrencyResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Nueva moneda base */
  newBaseCurrency: ICurrency;
  /** Moneda base anterior (si había) */
  previousBaseCurrency?: ICurrency;
  /** Mensaje informativo */
  message?: string;
}

/**
 * Información de uso de una moneda.
 */
export interface ICurrencyUsageInfo {
  /** Número de facturas de venta usando esta moneda */
  salesInvoicesCount: number;
  /** Número de facturas de compra usando esta moneda */
  purchaseInvoicesCount: number;
  /** Número de órdenes usando esta moneda */
  ordersCount: number;
  /** Indica si la moneda puede ser deshabilitada */
  canDisable: boolean;
  /** Razón por la que no puede deshabilitarse */
  reason?: string;
}

/**
 * Filtros para listar monedas.
 */
export interface IListCurrenciesParams {
  /** Si es true, retorna solo las activas */
  activeOnly?: boolean;
  /** Filtrar por código */
  code?: string;
  /** Incluir información de uso */
  includeUsageInfo?: boolean;
}
