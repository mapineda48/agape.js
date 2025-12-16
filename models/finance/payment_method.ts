import schema from "../schema";
import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { dateTime } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";

/**
 * Método de Pago (Payment Method)
 *
 * Catálogo de las formas de pago disponibles en el sistema.
 * Ejemplos: Efectivo, Transferencia Bancaria, Tarjeta de Crédito, Cheque, etc.
 *
 * Este modelo es fundamental para:
 * - Clasificar los pagos recibidos y emitidos
 * - Reportes por forma de pago
 * - Integración con pasarelas de pago
 * - Conciliación bancaria
 *
 * @example
 * ```ts
 * // Efectivo
 * { code: "CASH", fullName: "Efectivo", requiresReference: false }
 *
 * // Transferencia bancaria
 * { code: "TRANSFER", fullName: "Transferencia Bancaria", requiresReference: true }
 * ```
 */
export const paymentMethod = schema.table(
  "finance_payment_method",
  {
    /** Identificador único */
    id: serial("id").primaryKey(),

    /** Código interno del método de pago */
    code: varchar("code", { length: 20 }).notNull(),

    /** Nombre descriptivo del método de pago */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Descripción detallada */
    description: varchar("description", { length: 255 }),

    /**
     * Indica si el método requiere un número de referencia.
     * Ej: Transferencias requieren número de transacción,
     * Cheques requieren número de cheque, Efectivo no.
     */
    requiresReference: boolean("requires_reference").notNull().default(false),

    /**
     * Indica si el método requiere una cuenta bancaria asociada.
     * Útil para conciliación bancaria automática.
     */
    requiresBankAccount: boolean("requires_bank_account")
      .notNull()
      .default(false),

    /** Indica si el método de pago está habilitado */
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
    /** Código único de método de pago */
    uniqueIndex("ux_finance_payment_method_code").on(table.code),
  ]
);

export type PaymentMethod = InferSelectModel<typeof paymentMethod>;
export type NewPaymentMethod = InferInsertModel<typeof paymentMethod>;

export default paymentMethod;
