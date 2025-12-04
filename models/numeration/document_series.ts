import { schema } from "../agape";
import {
  integer,
  bigint,
  date,
  boolean,
  varchar,
  serial,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { documentType } from "./document_type";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { dateTime } from "../../lib/db/custom-types";

/**
 * Series / numeraciones para tipos de documento.
 * Aquí se define el rango de numeración, la vigencia y el número actual.
 */
export const documentSeries = schema.table(
  "numeration_document_series",
  {
    /** Identificador interno de la serie */
    id: serial("id").primaryKey(),

    /** FK al tipo de documento de negocio */
    documentTypeId: integer("document_type_id")
      .notNull()
      .references(() => documentType.id, { onDelete: "restrict" }),

    /**
     * Código de la serie/numeración.
     * Ejemplos: "INV-2025-A", "F001", "POS1-2025".
     */
    seriesCode: varchar("series_code", { length: 50 }).notNull(),

    /** Prefijo opcional para el número (ej. "INV-", "FAC-", "POS1-") */
    prefix: varchar("prefix", { length: 20 }),

    /** Sufijo opcional para el número (ej. "-2025") */
    suffix: varchar("suffix", { length: 20 }),

    /** Número inicial permitido dentro de la serie */
    startNumber: bigint("start_number", { mode: "number" }).notNull(),

    /** Número final permitido dentro de la serie (rango máximo) */
    endNumber: bigint("end_number", { mode: "number" }).notNull(),

    /**
     * Número actual asignado.
     * Normalmente se inicializa como startNumber - 1 para que el primero asignado
     * sea startNumber.
     */
    currentNumber: bigint("current_number", { mode: "number" }).notNull(),

    /** Fecha desde la cual la serie está vigente */
    validFrom: dateTime("valid_from").notNull(),

    /** Fecha hasta la cual la serie está vigente (puede ser null si no tiene fin definido) */
    validTo: dateTime("valid_to"),

    /** Indica si la serie está activa para asignar números */
    isActive: boolean("is_active").notNull().default(true),

    /**
     * Marca de "serie por defecto" para ese tipo de documento.
     * La unicidad de la serie por defecto se maneja a nivel de aplicación.
     */
    isDefault: boolean("is_default").notNull().default(false),
  },
  (table) => [
    /** Evitamos series duplicadas por tipo de documento y código */
    uniqueIndex("ux_document_series_type_series_code").on(
      table.documentTypeId,
      table.seriesCode
    ),

    /** Índices útiles para búsquedas y filtros habituales */
    index("ix_document_series_type").on(table.documentTypeId),
    index("ix_document_series_active").on(table.isActive),
  ]
);

export type DocumentSeries = InferSelectModel<typeof documentSeries>;
export type NewDocumentSeries = InferInsertModel<typeof documentSeries>;
