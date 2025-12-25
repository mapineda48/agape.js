import { serial, integer, varchar, index, check } from "drizzle-orm/pg-core";
import { type InferInsertModel, type InferSelectModel, sql } from "drizzle-orm";
import { schema } from "../schema";
import { decimal, dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import gl_journal_entry from "./gl_journal_entry";
import { glAccount } from "./gl_account";

/**
 * Línea de Asiento Contable (Journal Entry Line)
 *
 * Representa cada movimiento (débito o crédito) dentro de un asiento contable.
 * Cada línea afecta una cuenta del plan de cuentas.
 *
 * Reglas fundamentales:
 * - Cada línea puede tener débito O crédito, pero no ambos
 * - La cuenta referenciada debe tener allowPosting = true
 * - La suma de débitos y créditos de todas las líneas debe coincidir
 *
 * Al contabilizar (status = posted), los saldos de las cuentas se actualizan.
 *
 * @example
 * ```ts
 * // Línea de débito (Aumenta Cuentas por Cobrar)
 * {
 *   journalEntryId: 1,
 *   accountId: 10,         // Cuenta: Clientes
 *   lineNumber: 1,
 *   description: "Factura FV-2024-001",
 *   debitAmount: "1190.00",
 *   creditAmount: "0.00"
 * }
 *
 * // Línea de crédito (Aumenta Ventas)
 * {
 *   journalEntryId: 1,
 *   accountId: 50,         // Cuenta: Ingresos por Ventas
 *   lineNumber: 2,
 *   description: "Factura FV-2024-001",
 *   debitAmount: "0.00",
 *   creditAmount: "1000.00"
 * }
 * ```
 */
const gl_journal_line = schema.table(
  "finance_gl_journal_line",
  {
    /** Identificador único de la línea */
    id: serial("id").primaryKey(),

    /** FK al asiento contable (header) */
    journalEntryId: integer("journal_entry_id")
      .notNull()
      .references(() => gl_journal_entry.id, { onDelete: "cascade" }),

    /** FK a la cuenta contable afectada */
    accountId: integer("account_id")
      .notNull()
      .references(() => glAccount.id, { onDelete: "restrict" }),

    /**
     * Número de línea dentro del asiento.
     * Permite ordenar las líneas para presentación.
     */
    lineNumber: integer("line_number").notNull(),

    /** Descripción específica de esta línea */
    description: varchar("description", { length: 255 }),

    /**
     * Monto al debe.
     * Si esta línea es un crédito, debitAmount = 0.
     */
    debitAmount: decimal("debit_amount")
      .notNull()
      .default(sql`0`),

    /**
     * Monto al haber.
     * Si esta línea es un débito, creditAmount = 0.
     */
    creditAmount: decimal("credit_amount")
      .notNull()
      .default(sql`0`),

    /**
     * Referencia adicional para análisis dimensional.
     * Puede usarse para centro de costo, proyecto, etc.
     */
    reference: varchar("reference", { length: 100 }),

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
    /** Índice para búsquedas por asiento */
    index("ix_finance_gl_journal_line_entry").on(table.journalEntryId),

    /** Índice para búsquedas por cuenta (para calcular saldos) */
    index("ix_finance_gl_journal_line_account").on(table.accountId),

    /**
     * Constraint: Al menos uno de debitAmount o creditAmount debe ser mayor a 0,
     * pero no ambos al mismo tiempo.
     */
    check(
      "ck_finance_gl_journal_line_amount",
      sql`(debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)`
    ),
  ]
);

export type GlJournalLine = InferSelectModel<typeof gl_journal_line>;
export type NewGlJournalLine = InferInsertModel<typeof gl_journal_line>;

export default gl_journal_line;
