/**
 * DTOs para Unidades de Medida (Unit of Measure - UOM)
 * @module inventory/unit_of_measure
 */

/**
 * DTO para crear/actualizar una unidad de medida.
 *
 * @remarks
 * El `code` será normalizado automáticamente a mayúsculas y sin espacios.
 */
export interface IUpsertUnitOfMeasure {
  /** ID de la UOM (si existe, es actualización) */
  id?: number;
  /** Código interno de la UOM (ej: UN, KG, LT, MT) - será normalizado a mayúsculas */
  code: string;
  /** Nombre completo de la unidad de medida */
  fullName: string;
  /** Descripción adicional (opcional) */
  description?: string | null;
  /** Indica si la UOM está habilitada */
  isEnabled?: boolean;
}

/**
 * Resultado de una unidad de medida.
 */
export interface IUnitOfMeasure {
  /** Identificador único de la UOM */
  id: number;
  /** Código interno de la UOM (siempre en mayúsculas) */
  code: string;
  /** Nombre completo de la unidad de medida */
  fullName: string;
  /** Descripción adicional */
  description: string | null;
  /** Indica si la UOM está habilitada */
  isEnabled: boolean;
}

/**
 * DTO para toggle (habilitar/deshabilitar) una UOM.
 */
export interface IToggleUnitOfMeasure {
  /** ID de la UOM */
  id: number;
  /** Nuevo estado de habilitación */
  isEnabled: boolean;
}

/**
 * Resultado de la operación toggle de UOM.
 */
export interface IToggleUnitOfMeasureResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** UOM actualizada */
  unitOfMeasure: IUnitOfMeasure;
  /** Mensaje informativo */
  message?: string;
}

/**
 * Información de uso de una UOM.
 */
export interface IUnitOfMeasureUsageInfo {
  /** Número de ítems de inventario que usan esta UOM como unidad base */
  inventoryItemsCount: number;
  /** Número de reglas de conversión activas que usan esta UOM */
  activeConversionsCount: number;
  /** Indica si la UOM puede ser deshabilitada */
  canDisable: boolean;
  /** Razón por la que no puede deshabilitarse (si aplica) */
  reason?: string;
}

/**
 * Filtros para listar unidades de medida.
 */
export interface IListUnitOfMeasureParams {
  /** Si es true, retorna solo las activas */
  activeOnly?: boolean;
  /** Filtrar por código (búsqueda parcial) */
  code?: string;
  /** Filtrar por nombre (búsqueda parcial) */
  fullName?: string;
  /** Incluir información de uso */
  includeUsageInfo?: boolean;
}

/**
 * UOM con información de uso.
 */
export interface IUnitOfMeasureWithUsage extends IUnitOfMeasure {
  /** Número de ítems usando esta UOM */
  itemsCount?: number;
  /** Número de conversiones usando esta UOM */
  conversionsCount?: number;
}
