import { schema } from "../agape";
import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel, sql } from "drizzle-orm";
import { decimal } from "../../lib/db/custom-types";

/**
 * Moneda (Currency)
 *
 * Catálogo de monedas habilitadas para el sistema.
 * Permite multi-moneda en transacciones de compras, ventas e inventario.
 *
 * **Reglas de negocio:**
 * - Solo puede existir una moneda base (isBase = true) por tenant.
 * - No se puede deshabilitar la moneda base.
 * - No se puede establecer como base una moneda deshabilitada.
 *
 * @example
 * ```ts
 * // Moneda base (local)
 * { code: "COP", fullName: "Peso Colombiano", isBase: true, symbol: "$" }
 *
 * // Moneda extranjera
 * { code: "USD", fullName: "Dólar Estadounidense", isBase: false, symbol: "$" }
 * ```
 */
export const currency = schema.table(
  "finance_currency",
  {
    /** Identificador único de la moneda */
    id: serial("id").primaryKey(),

    /**
     * Código ISO 4217 de la moneda (ej: COP, USD, EUR).
     * Debe ser único y en mayúsculas.
     */
    code: varchar("code", { length: 3 }).notNull(),

    /** Nombre completo de la moneda */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Símbolo de la moneda (ej: $, €, £) */
    symbol: varchar("symbol", { length: 5 }).notNull().default("$"),

    /**
     * Tasa de cambio respecto a la moneda base.
     * Para la moneda base siempre es 1.00.
     * Para otras monedas, representa cuántas unidades de moneda base
     * equivalen a 1 unidad de esta moneda.
     */
    exchangeRate: decimal("exchange_rate")
      .notNull()
      .default(sql`1`),

    /**
     * Indica si es la moneda base del sistema.
     * Solo puede haber una moneda base por tenant.
     * Todas las transacciones se convierten a esta moneda para reportes.
     */
    isBase: boolean("is_base").notNull().default(false),

    /** Indica si la moneda está habilitada para uso en transacciones */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Código único de moneda */
    uniqueIndex("ux_finance_currency_code").on(table.code),
  ]
);

export type Currency = InferSelectModel<typeof currency>;
export type NewCurrency = InferInsertModel<typeof currency>;

export default currency;
