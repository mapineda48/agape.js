import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import ctx from "../../lib/db/schema/ctx";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Modelo de tipo de documento de identificación (IdentityDocumentType)
 * Catálogo de tipos de documento de identificación personal/empresarial.
 * Ejemplos: CC (Cédula), NIT, PAS (Pasaporte), CE (Cédula Extranjera), etc.
 *
 * Nota: Esta tabla es distinta de numeration_document_type que maneja
 * documentos de negocio (facturas, órdenes, etc.).
 */
export const documentType = ctx(({ table }) => table(
  "core_identity_document_type",
  {
    /** Identificador único del tipo de documento */
    id: serial("id").primaryKey(),

    /** Código corto del tipo de documento (CC, NIT, PAS, CE, etc.) */
    code: varchar("code", { length: 10 }).notNull(),

    /** Nombre descriptivo del tipo de documento */
    name: varchar("name", { length: 100 }).notNull(),

    /** Indica si el tipo de documento está habilitado */
    isEnabled: boolean("is_enabled").notNull().default(true),

    /** Indica si aplica para personas naturales */
    appliesToPerson: boolean("applies_to_person").notNull(),

    /** Indica si aplica para personas jurídicas (empresas) */
    appliesToCompany: boolean("applies_to_company").notNull(),
  },
  (table) => [uniqueIndex("ux_identity_document_type_code").on(table.code)]
));

export type DocumentType = InferSelectModel<typeof documentType>;
export type NewDocumentType = InferInsertModel<typeof documentType>;

export default documentType;
