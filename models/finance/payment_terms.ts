import ctx from "../../lib/db/schema/ctx";
import {
  serial,
  varchar,
  boolean,
  smallint,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Condiciones de Pago (Payment Terms)
 *
 * Define las condiciones de pago que se pueden aplicar a órdenes y facturas.
 * Ejemplos: Contado, 30 días, 60 días, 50% anticipo + 50% a 30 días, etc.
 *
 * Este modelo es fundamental para:
 * - Definir plazos de vencimiento de facturas
 * - Calcular fechas de vencimiento de cuentas por cobrar/pagar
 * - Gestionar políticas de crédito por cliente
 *
 * @example
 * ```ts
 * // Contado
 * { code: "CASH", fullName: "Pago de Contado", dueDays: 0 }
 *
 * // Crédito 30 días
 * { code: "NET30", fullName: "Neto 30 días", dueDays: 30 }
 * ```
 */
export const paymentTerms = ctx(({ table }) => table(
  "finance_payment_terms",
  {
    /** Identificador único */
    id: serial("id").primaryKey(),

    /** Código interno de la condición de pago */
    code: varchar("code", { length: 20 }).notNull(),

    /** Nombre descriptivo de la condición de pago */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Descripción detallada */
    description: varchar("description", { length: 255 }),

    /**
     * Días para vencimiento desde la fecha del documento.
     * 0 = Contado (vence el mismo día)
     */
    dueDays: smallint("due_days").notNull().default(0),

    /** Indica si es la condición de pago por defecto */
    isDefault: boolean("is_default").notNull().default(false),

    /** Indica si la condición de pago está habilitada */
    isEnabled: boolean("is_enabled").notNull().default(true),

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
    /** Código único de condición de pago */
    uniqueIndex("ux_finance_payment_terms_code").on(table.code),
  ]
));

export type PaymentTerms = InferSelectModel<typeof paymentTerms>;
export type NewPaymentTerms = InferInsertModel<typeof paymentTerms>;

export default paymentTerms;
