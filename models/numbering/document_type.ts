import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { schema } from "../schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Tipos de documento de negocio (ventas, facturas, movimientos de inventario, etc.)
 * Ejemplos: INV_ENT, INV_SAL, VTA, FAC, NC, REC, etc.
 *
 * Nota: Esta tabla es distinta de core_identity_document_type que maneja
 * documentos de identificación personal (CC, NIT, PAS, etc.).
 */
export const documentType = schema.table(
  "numbering_document_type",
  {
    /** Identificador interno del tipo de documento */
    id: serial("id").primaryKey(),

    /**
     * Código corto del tipo de documento.
     * Debe ser único dentro del sistema (por ejemplo: "INV_ENT", "FAC", "VTA").
     */
    code: varchar("code", { length: 30 }).notNull(),

    /** Nombre descriptivo del tipo de documento */
    name: varchar("name", { length: 100 }).notNull(),

    /** Descripción más larga y opcional */
    description: varchar("description", { length: 255 }),

    /**
     * Módulo funcional principal donde se usa este documento.
     * Ejemplos: "inventory", "sales", "billing", "purchases", etc.
     * Es solo informativo para clasificación.
     */
    module: varchar("module", { length: 30 }),

    /** Indica si este tipo de documento está habilitado para uso */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Evitamos tipos de documento duplicados por código */
    uniqueIndex("ux_numbering_document_type_code").on(table.code),
  ]
);

export type DocumentType = InferSelectModel<typeof documentType>;
export type NewDocumentType = InferInsertModel<typeof documentType>;
