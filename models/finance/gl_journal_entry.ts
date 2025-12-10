import {
  serial,
  integer,
  bigint,
  date,
  varchar,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import { schema } from "../agape";
import { decimal, dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import { documentSeries } from "../numbering/document_series";
import { user } from "../core/user";

/**
 * Enum de estado del asiento contable.
 */
export const journalEntryStatusEnum = schema.enum(
  "finance_gl_journal_entry_status",
  [
    "draft", // Borrador
    "posted", // Contabilizado
    "cancelled", // Anulado
  ]
);

/**
 * Enum de tipo de asiento contable.
 * Permite clasificar los asientos por su origen.
 */
export const journalEntryTypeEnum = schema.enum(
  "finance_gl_journal_entry_type",
  [
    "manual", // Asiento manual
    "sales", // Generado por venta
    "purchase", // Generado por compra
    "payment", // Generado por pago/cobro
    "inventory", // Generado por movimiento de inventario
    "adjustment", // Asiento de ajuste
    "closing", // Asiento de cierre
    "opening", // Asiento de apertura
  ]
);

/**
 * Asiento Contable (Journal Entry Header)
 *
 * Representa el encabezado de un asiento contable.
 * Las líneas de detalle (débitos y créditos) se almacenan en gl_journal_line.
 *
 * Reglas fundamentales:
 * - La suma de débitos debe ser igual a la suma de créditos
 * - Un asiento debe tener al menos 2 líneas
 * - Solo asientos en estado "posted" afectan los saldos
 *
 * Los asientos pueden ser:
 * - Manuales: Creados directamente por el usuario
 * - Automáticos: Generados por otros módulos (ventas, compras, pagos, inventario)
 *
 * @example
 * ```ts
 * // Asiento de venta
 * {
 *   type: "sales",
 *   entryDate: new Date(),
 *   description: "Venta factura FV-2024-001",
 *   referenceType: "sales_invoice",
 *   referenceId: 1,
 *   totalDebit: "1190.00",
 *   totalCredit: "1190.00",
 *   status: "posted"
 * }
 * ```
 */
const gl_journal_entry = schema.table(
  "finance_gl_journal_entry",
  {
    /** Identificador único del asiento */
    id: serial("id").primaryKey(),

    /** FK a la serie de numeración que asigna el número del documento */
    seriesId: integer("series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /** Número del documento asignado dentro de la serie */
    documentNumber: bigint("document_number", { mode: "number" }).notNull(),

    /** Tipo de asiento (manual, ventas, compras, etc.) */
    type: journalEntryTypeEnum("type").notNull(),

    /** Fecha del asiento contable */
    entryDate: date("entry_date").defaultNow().notNull(),

    /** Descripción o concepto del asiento */
    description: varchar("description", { length: 500 }).notNull(),

    /** Código de moneda (ej: COP, USD) */
    currencyCode: varchar("currency_code", { length: 3 })
      .notNull()
      .default("COP"),

    /** Tasa de cambio (Default 1.0) */
    exchangeRate: decimal("exchange_rate")
      .notNull()
      .default(sql`1`),

    /**
     * Tipo de documento de referencia que originó el asiento.
     * Ej: "sales_invoice", "purchase_invoice", "payment", etc.
     */
    referenceType: varchar("reference_type", { length: 50 }),

    /**
     * ID del documento de referencia.
     * Junto con referenceType permite navegar al documento origen.
     */
    referenceId: integer("reference_id"),

    /**
     * Total de débitos del asiento.
     * Debe ser igual a totalCredit para que el asiento cuadre.
     */
    totalDebit: decimal("total_debit")
      .notNull()
      .default(sql`0`),

    /**
     * Total de créditos del asiento.
     * Debe ser igual a totalDebit para que el asiento cuadre.
     */
    totalCredit: decimal("total_credit")
      .notNull()
      .default(sql`0`),

    /** Estado del asiento */
    status: journalEntryStatusEnum("status").default("draft").notNull(),

    /** Notas internas */
    notes: varchar("notes", { length: 1000 }),

    /** Usuario que creó el registro */
    createdById: integer("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    /** Usuario que actualizó por última vez */
    updatedById: integer("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),

    /** Fecha de creación del registro */
    createdAt: dateTime("created_at")
      .default(sql`now()`)
      .notNull(),

    /** Fecha de última actualización del registro */
    updatedAt: dateTime("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => new DateTime()),
  },
  (table) => [
    /** Garantiza unicidad del número de documento dentro de la serie */
    uniqueIndex("ux_finance_gl_journal_entry_series_number").on(
      table.seriesId,
      table.documentNumber
    ),

    /** Índice para búsquedas por serie */
    index("ix_finance_gl_journal_entry_series").on(table.seriesId),

    /** Índice para búsquedas por tipo */
    index("ix_finance_gl_journal_entry_type").on(table.type),

    /** Índice para búsquedas por fecha */
    index("ix_finance_gl_journal_entry_date").on(table.entryDate),

    /** Índice para búsquedas por estado */
    index("ix_finance_gl_journal_entry_status").on(table.status),

    /** Índice para búsquedas por documento de referencia */
    index("ix_finance_gl_journal_entry_reference").on(
      table.referenceType,
      table.referenceId
    ),
  ]
);

export type GlJournalEntry = InferSelectModel<typeof gl_journal_entry>;
export type NewGlJournalEntry = InferInsertModel<typeof gl_journal_entry>;
export type JournalEntryStatus =
  (typeof journalEntryStatusEnum.enumValues)[number];
export type JournalEntryType = (typeof journalEntryTypeEnum.enumValues)[number];

export default gl_journal_entry;
