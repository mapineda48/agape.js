import { schema } from "../schema";
import {
  serial,
  integer,
  varchar,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Enum de tipo de cuenta contable.
 * Clasificación según su naturaleza en el balance.
 */
export const accountTypeEnum = schema.enum("finance_gl_account_type", [
  "asset", // Activo
  "liability", // Pasivo
  "equity", // Patrimonio
  "revenue", // Ingreso
  "expense", // Gasto
]);

/**
 * Enum de naturaleza de la cuenta.
 * Define si la cuenta aumenta con débitos o créditos.
 */
export const accountNatureEnum = schema.enum("finance_gl_account_nature", [
  "debit", // Naturaleza deudora (Activos, Gastos)
  "credit", // Naturaleza acreedora (Pasivos, Patrimonio, Ingresos)
]);

/**
 * Plan de Cuentas (Chart of Accounts / GL Account)
 *
 * Define la estructura del plan contable de la organización.
 * Cada cuenta tiene un código jerárquico que permite agrupar cuentas.
 *
 * Estructura jerárquica:
 * - Cuentas de nivel 1 (ej: 1, 2, 3, 4, 5)
 * - Cuentas de nivel 2 (ej: 1.1, 1.2, 2.1)
 * - Cuentas de detalle (ej: 1.1.01, 1.1.02)
 *
 * Solo las cuentas de detalle (allowPosting = true) pueden recibir asientos.
 * Las cuentas padre (allowPosting = false) son solo para agrupación.
 *
  */
export const glAccount = schema.table(
  "finance_gl_account",
  {
    /** Identificador único */
    id: serial("id").primaryKey(),

    /**
     * Código de la cuenta contable.
     * Estructura jerárquica sugerida: X.X.XX
     */
    code: varchar("code", { length: 20 }).notNull(),

    /** Nombre de la cuenta */
    name: varchar("name", { length: 150 }).notNull(),

    /** Descripción detallada de la cuenta */
    description: varchar("description", { length: 500 }),

    /** Tipo de cuenta (activo, pasivo, patrimonio, ingreso, gasto) */
    type: accountTypeEnum("type").notNull(),

    /** Naturaleza de la cuenta (débito o crédito) */
    nature: accountNatureEnum("nature").notNull(),

    /**
     * ID de la cuenta padre para estructura jerárquica.
     * NULL si es cuenta de nivel superior.
     */
    parentId: integer("parent_id"),

    /**
     * Nivel en la jerarquía (1, 2, 3, etc.).
     * Facilita consultas y reportes por nivel.
     */
    level: integer("level").notNull().default(1),

    /**
     * Indica si la cuenta acepta asientos contables.
     * Solo las cuentas de detalle (hojas) permiten posting.
     * Las cuentas de agrupación no permiten posting.
     */
    allowPosting: boolean("allow_posting").notNull().default(true),

    /** Indica si la cuenta está activa */
    isActive: boolean("is_active").notNull().default(true),

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
    /** Código único de cuenta */
    uniqueIndex("ux_finance_gl_account_code").on(table.code),

    /** Índice para búsquedas por tipo */
    index("ix_finance_gl_account_type").on(table.type),

    /** Índice para búsquedas por padre (navegación jerárquica) */
    index("ix_finance_gl_account_parent").on(table.parentId),

    /** Índice para cuentas que permiten posting */
    index("ix_finance_gl_account_posting").on(table.allowPosting),
  ]
);

export type GlAccount = InferSelectModel<typeof glAccount>;
export type NewGlAccount = InferInsertModel<typeof glAccount>;
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type AccountNature = (typeof accountNatureEnum.enumValues)[number];

export default glAccount;
