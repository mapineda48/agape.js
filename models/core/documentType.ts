import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { schema } from "../agape";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Modelo de tipo de documento (DocumentType)
 * Catálogo de tipos de documento de identificación.
 */
export const documentType = schema.table(
  "document_type",
  {
    /** Identificador único del tipo de documento */
    id: serial("id").primaryKey(),

    /** Código corto del tipo de documento (CC, NIT, PAS, etc.) */
    code: varchar("code", { length: 10 }).notNull(),

    /** Nombre descriptivo del tipo de documento */
    name: varchar("name", { length: 100 }).notNull(),

    /** Indica si el tipo de documento está habilitado */
    isEnabled: boolean("is_enabled").notNull(),

    /** Indica si aplica para personas naturales */
    appliesToPerson: boolean("applies_to_person").notNull(),

    /** Indica si aplica para personas jurídicas (empresas) */
    appliesToCompany: boolean("applies_to_company").notNull(),
  },
  (table) => [uniqueIndex("ux_document_type_code").on(table.code)]
);

export type DocumentType = InferSelectModel<typeof documentType>;
export type NewDocumentType = InferInsertModel<typeof documentType>;

export default documentType;
