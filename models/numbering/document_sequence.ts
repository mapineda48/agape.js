import { schema } from "../agape";
import {
  integer,
  bigint,
  varchar,
  serial,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { documentSeries } from "./document_series";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { dateTime } from "../../lib/db/custom-types";

/**
 * Registro histórico de números asignados por serie.
 * Permite auditoría y evitar duplicados en (serie, número).
 */
export const documentSequence = schema.table(
  "numbering_document_sequence",
  {
    /** Identificador interno de la fila */
    id: serial("id").primaryKey(),

    /** FK a la serie que asignó el número */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número asignado dentro de la serie */
    assignedNumber: bigint("assigned_number", { mode: "number" }).notNull(),

    /**
     * Identificador del documento externo (venta, factura, movimiento, etc.).
     * Se guarda como texto para no acoplar el motor de numeración a una tabla concreta.
     * Puedes guardar aquí un UUID, un ID numérico convertido a string, etc.
     */
    externalDocumentId: varchar("external_document_id", {
      length: 100,
    }).notNull(),

    /**
     * Tipo / tabla / contexto del documento externo.
     * Ejemplos: "inventory_movement", "sale_order", "invoice", etc.
     * Esto ayuda a saber a qué dominio pertenece el documento.
     */
    externalDocumentType: varchar("external_document_type", {
      length: 50,
    }).notNull(),

    /** Fecha de asignación del número */
    assignedDate: dateTime("assigned_date").notNull(),
  },
  (table) => [
    /** Garantiza que no haya dos documentos diferentes con el mismo número en la misma serie */
    uniqueIndex("ux_numbering_sequence_series_number").on(
      table.seriesId,
      table.assignedNumber
    ),

    /** Búsquedas típicas por documento externo */
    index("ix_numbering_sequence_external").on(
      table.externalDocumentType,
      table.externalDocumentId
    ),

    /** Búsquedas típicas por serie */
    index("ix_numbering_sequence_series").on(table.seriesId),
  ]
);

export type DocumentSequence = InferSelectModel<typeof documentSequence>;
export type NewDocumentSequence = InferInsertModel<typeof documentSequence>;
