/**
 * DTOs para tipos de documento de identidad.
 * @module core/documentType
 */

/**
 * DTO para crear/actualizar un tipo de documento de identidad.
 */
export interface IUpsertDocumentType {
  /** ID del tipo de documento (si existe, es actualización) */
  id?: number;
  /** Código corto del tipo de documento (CC, NIT, PAS, etc.) */
  code: string;
  /** Nombre descriptivo del tipo de documento */
  name: string;
  /** Indica si el tipo de documento está habilitado */
  isEnabled?: boolean;
  /** Indica si aplica para personas naturales */
  appliesToPerson: boolean;
  /** Indica si aplica para personas jurídicas (empresas) */
  appliesToCompany: boolean;
}

/**
 * Filtros para listar tipos de documento.
 */
export interface IListDocumentTypesParams {
  /** Si es true, retorna solo los activos */
  activeOnly?: boolean;
  /** Si es true, retorna solo los que aplican a personas */
  personOnly?: boolean;
  /** Si es true, retorna solo los que aplican a empresas */
  companyOnly?: boolean;
}

/**
 * Resultado de un tipo de documento.
 */
export interface IDocumentType {
  /** Identificador único del tipo de documento */
  id: number;
  /** Código corto del tipo de documento */
  code: string;
  /** Nombre descriptivo del tipo de documento */
  name: string;
  /** Indica si el tipo de documento está habilitado */
  isEnabled: boolean;
  /** Indica si aplica para personas naturales */
  appliesToPerson: boolean;
  /** Indica si aplica para personas jurídicas (empresas) */
  appliesToCompany: boolean;
}

/**
 * DTO para toggle (habilitar/deshabilitar) un tipo de documento.
 */
export interface IToggleDocumentType {
  /** ID del tipo de documento */
  id: number;
  /** Nuevo estado de habilitación */
  isEnabled: boolean;
}

/**
 * Resultado de la operación toggle.
 */
export interface IToggleDocumentTypeResult {
  /** Si la operación fue exitosa */
  success: boolean;
  /** Tipo de documento actualizado */
  documentType: IDocumentType;
  /** Mensaje informativo */
  message?: string;
}
