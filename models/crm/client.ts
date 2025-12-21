import { integer, boolean, varchar } from "drizzle-orm/pg-core";
import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import ctx from "../../lib/db/schema/ctx";
import user from "../core/user";
import client_type from "./client_type";
import { dateTime, decimal } from "../../lib/db/custom-types";
import DateTime from "../../lib/utils/data/DateTime";
import { priceList } from "../catalogs/price_list";
import { paymentTerms } from "../finance/payment_terms";
import employee from "../hr/employee";

/**
 * Modelo de cliente (Client)
 * Representa un cliente en el sistema CRM.
 * Implementa Class Table Inheritance (CTI): PK = FK a user.id.
 * El id NO es serial porque se hereda del registro padre en user.
 *
 * Campos comerciales estándar de ERP:
 * - priceListId: Lista de precios asignada
 * - paymentTermsId: Condiciones de pago por defecto
 * - creditLimit: Límite de crédito máximo
 * - creditDays: Días de crédito por defecto
 * - salespersonId: Vendedor/representante asignado
 */
const client = ctx(({ table }) => table("crm_client", {
  /**
   * Identificador único del cliente.
   * Es FK a user.id (un cliente ES un user).
   * No es serial: el id se asigna desde la tabla padre user.
   */
  id: integer("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "restrict" }),

  /** Identificador del tipo de cliente */
  typeId: integer("type_id").references(() => client_type.id),
  /** URL de la foto del cliente */
  photoUrl: varchar("photo_url", { length: 500 }),
  /** Indica si el cliente está activo */
  active: boolean("active").default(true).notNull(),

  // ========================================================================
  // Campos Comerciales (ERP)
  // ========================================================================

  /**
   * Lista de precios asignada al cliente.
   * Determina los precios que se aplican en órdenes y facturas.
   * Si es null, se usa la lista de precios por defecto del sistema.
   */
  priceListId: integer("price_list_id").references(() => priceList.id, {
    onDelete: "set null",
  }),

  /**
   * Condiciones de pago por defecto del cliente.
   * Se heredan a órdenes y facturas pero pueden ser sobrescritas.
   */
  paymentTermsId: integer("payment_terms_id").references(
    () => paymentTerms.id,
    { onDelete: "set null" }
  ),

  /**
   * Límite de crédito máximo del cliente.
   * Usado para control de cuentas por cobrar.
   */
  creditLimit: decimal("credit_limit"),

  /**
   * Días de crédito por defecto del cliente.
   * Puede usarse como override sobre paymentTerms.
   */
  creditDays: integer("credit_days"),

  /**
   * Vendedor/representante comercial asignado al cliente.
   * Útil para comisiones, reportes y seguimiento.
   */
  salespersonId: integer("salesperson_id").references(() => employee.id, {
    onDelete: "set null",
  }),

  /**
   * Código interno del cliente (código corto para referencia rápida).
   * Ej: "CLI-001", "ACME", etc.
   */
  clientCode: varchar("client_code", { length: 20 }),

  // ========================================================================
  // Timestamps
  // ========================================================================

  /** Fecha de creación del registro */
  createdAt: dateTime("created_at")
    .default(sql`now()`)
    .notNull(),
  /** Fecha de última actualización del registro */
  updatedAt: dateTime("updated_at")
    .default(sql`now()`)
    .$onUpdate(() => new DateTime()),
}));

export type Client = InferSelectModel<typeof client>;
export type NewClient = InferInsertModel<typeof client>;

export default client;
