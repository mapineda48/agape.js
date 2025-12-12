/**
 * DTOs para Grupos de Impuestos (Tax Group)
 * @module finance/tax_group
 */

import type Decimal from "../../data/Decimal";

/**
 * DTO para crear/actualizar un impuesto individual.
 */
export interface IUpsertTax {
  /** ID del impuesto (si existe, es actualización) */
  id?: number;
  /** Código interno del impuesto (ej: IVA19, EXE) */
  code: string;
  /** Nombre del impuesto */
  fullName: string;
  /** Descripción adicional */
  description?: string | null;
  /** Tasa del impuesto en porcentaje (ej: 19.00) */
  rate: Decimal;
  /** Indica si el impuesto está habilitado */
  isEnabled?: boolean;
}

/**
 * Resultado de un impuesto.
 */
export interface ITax {
  /** Identificador único del impuesto */
  id: number;
  /** Código interno del impuesto */
  code: string;
  /** Nombre del impuesto */
  fullName: string;
  /** Descripción adicional */
  description: string | null;
  /** Tasa del impuesto en porcentaje */
  rate: Decimal;
  /** Indica si el impuesto está habilitado */
  isEnabled: boolean;
}

/**
 * DTO para crear/actualizar un grupo de impuestos.
 *
 * @remarks
 * Un grupo de impuestos agrupa uno o más impuestos para facilitar
 * su asignación a ítems del catálogo.
 */
export interface IUpsertTaxGroup {
  /** ID del grupo (si existe, es actualización) */
  id?: number;
  /** Código interno del grupo (único) */
  code: string;
  /** Nombre del grupo de impuestos */
  fullName: string;
  /** Descripción del grupo */
  description?: string | null;
  /** IDs de los impuestos que pertenecen a este grupo */
  taxIds: number[];
  /** Indica si el grupo está habilitado */
  isEnabled?: boolean;
}

/**
 * Resultado de un grupo de impuestos.
 */
export interface ITaxGroup {
  /** Identificador único del grupo */
  id: number;
  /** Código interno del grupo */
  code: string;
  /** Nombre del grupo */
  fullName: string;
  /** Descripción del grupo */
  description: string | null;
  /** Indica si el grupo está habilitado */
  isEnabled: boolean;
}

/**
 * Grupo de impuestos con sus impuestos detallados.
 */
export interface ITaxGroupWithTaxes extends ITaxGroup {
  /** Lista de impuestos asociados */
  taxes: ITax[];
  /** Tasa total combinada (suma de tasas) */
  totalRate: Decimal;
}

/**
 * DTO para toggle (habilitar/deshabilitar) un grupo de impuestos.
 */
export interface IToggleTaxGroup {
  /** ID del grupo */
  id: number;
  /** Nuevo estado de habilitación */
  isEnabled: boolean;
}

/**
 * Resultado de la operación toggle.
 */
export interface IToggleTaxGroupResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Grupo actualizado */
  taxGroup: ITaxGroup;
  /** Mensaje informativo */
  message?: string;
  /** Número de productos afectados (si hay advertencia) */
  affectedProductsCount?: number;
}

/**
 * Información de uso de un grupo de impuestos.
 */
export interface ITaxGroupUsageInfo {
  /** Número de productos usando este grupo */
  productsCount: number;
  /** Indica si el grupo puede ser deshabilitado */
  canDisable: boolean;
  /** Razón por la que no puede deshabilitarse */
  reason?: string;
}

/**
 * Filtros para listar grupos de impuestos.
 */
export interface IListTaxGroupsParams {
  /** Si es true, retorna solo los activos */
  activeOnly?: boolean;
  /** Incluir detalle de impuestos */
  includeTaxes?: boolean;
  /** Incluir información de uso */
  includeUsageInfo?: boolean;
}

/**
 * Filtros para listar impuestos.
 */
export interface IListTaxesParams {
  /** Si es true, retorna solo los activos */
  activeOnly?: boolean;
}

// ============================================================================
// DTOs para impuestos individuales (Tax)
// ============================================================================

/**
 * DTO para toggle (habilitar/deshabilitar) un impuesto individual.
 */
export interface IToggleTax {
  /** ID del impuesto */
  id: number;
  /** Nuevo estado de habilitación */
  isEnabled: boolean;
}

/**
 * Resultado de la operación toggle de impuesto.
 */
export interface IToggleTaxResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Impuesto actualizado */
  tax: ITax;
  /** Mensaje informativo */
  message?: string;
}

/**
 * Información de uso de un impuesto individual.
 */
export interface ITaxUsageInfo {
  /** Número de líneas de facturas de venta usando este impuesto */
  salesInvoiceItemsCount: number;
  /** Número de líneas de facturas de compra usando este impuesto */
  purchaseInvoiceItemsCount: number;
  /** Número de grupos de impuestos activos que incluyen este impuesto */
  activeTaxGroupsCount: number;
  /** Indica si el impuesto puede ser deshabilitado */
  canDisable: boolean;
  /** Razón por la que no puede deshabilitarse */
  reason?: string;
}
