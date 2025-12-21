/**
 * Modelo de tipo de documento de identificación (DocumentType)
 *
 * Catálogo de tipos de documento de identificación personal/empresarial.
 * Ejemplos: CC (Cédula), NIT, PAS (Pasaporte), CE (Cédula Extranjera), etc.
 *
 * Nota: Esta tabla es distinta de numeration_document_type que maneja
 * documentos de negocio (facturas, órdenes, etc.).
 */
import type { Generated, Selectable, Insertable, Updateable } from "./types";

export interface DocumentTypeTable {
  /** Identificador único del tipo de documento */
  id: Generated<number>;

  /** Código corto del tipo de documento (CC, NIT, PAS, CE, etc.) */
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

export type DocumentType = Selectable<DocumentTypeTable>;
export type NewDocumentType = Insertable<DocumentTypeTable>;
export type DocumentTypeUpdate = Updateable<DocumentTypeTable>;
