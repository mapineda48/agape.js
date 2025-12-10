import { schema } from "../agape";
import {
  serial,
  varchar,
  boolean,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Grupo Contable de Ítems (Item Accounting Group / Posting Group)
 *
 * Define los grupos contables para la contabilización automática de ítems.
 * Similar a "Posting Groups" en SAP o "Account Groups" en Odoo.
 *
 * Cada grupo contable define a qué cuentas contables se postean:
 * - Las existencias (inventario)
 * - El costo de ventas
 * - Los ingresos por ventas
 * - Las compras
 *
 * Ejemplos:
 * - "Mercancía" → Inventario: 1435, Costo: 6135, Ingreso: 4135
 * - "Servicios" → Sin inventario, Ingreso: 4170
 * - "Materias Primas" → Inventario: 1405, Costo: 6205
 *
 * Nota: Los campos de cuentas contables (accountInventory, accountCostOfGoodsSold, etc.)
 * se agregarán cuando se implemente el módulo de contabilidad (chart of accounts).
 * Por ahora, solo se define la estructura base del grupo.
 */
export const itemAccountingGroup = schema.table(
  "finance_item_accounting_group",
  {
    /** Identificador único del grupo contable */
    id: serial("id").primaryKey(),

    /** Código interno del grupo contable */
    code: varchar("code", { length: 20 }).notNull(),

    /** Nombre del grupo contable */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Descripción del grupo contable */
    description: varchar("description", { length: 200 }),

    /**
     * Cuenta contable para inventario (existencias).
     * Por ahora es un código String; en el futuro será FK a chart_of_accounts.
     */
    accountInventory: varchar("account_inventory", { length: 20 }),

    /**
     * Cuenta contable para costo de ventas.
     * Por ahora es un código String; en el futuro será FK a chart_of_accounts.
     */
    accountCostOfGoodsSold: varchar("account_cost_of_goods_sold", {
      length: 20,
    }),

    /**
     * Cuenta contable para ingresos por ventas.
     * Por ahora es un código String; en el futuro será FK a chart_of_accounts.
     */
    accountSalesRevenue: varchar("account_sales_revenue", { length: 20 }),

    /**
     * Cuenta contable para compras.
     * Por ahora es un código String; en el futuro será FK a chart_of_accounts.
     */
    accountPurchases: varchar("account_purchases", { length: 20 }),

    /** Indica si el grupo contable está habilitado */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Código único de grupo contable */
    uniqueIndex("ux_finance_item_accounting_group_code").on(table.code),
  ]
);

export type ItemAccountingGroup = InferSelectModel<typeof itemAccountingGroup>;
export type NewItemAccountingGroup = InferInsertModel<
  typeof itemAccountingGroup
>;

export default itemAccountingGroup;
