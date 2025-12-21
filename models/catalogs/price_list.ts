import ctx from "../../lib/db/schema/ctx";
import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Lista de Precios (Price List)
 *
 * Representa diferentes listas de precios del sistema.
 * Ejemplos: Retail, Mayorista, Web, Promoción, etc.
 *
 * En ERPs típicos, esto permite tener múltiples precios por ítem
 * según el contexto de venta (canal, tipo de cliente, promociones).
 */
export const priceList = ctx(({ table }) => table(
  "catalogs_price_list",
  {
    /** Identificador único de la lista de precios */
    id: serial("id").primaryKey(),

    /** Código interno de la lista de precios */
    code: varchar("code", { length: 20 }).notNull(),

    /** Nombre de la lista de precios */
    fullName: varchar("full_name", { length: 80 }).notNull(),

    /** Descripción de la lista de precios */
    description: varchar("description", { length: 200 }),

    /** Indica si es la lista de precios por defecto */
    isDefault: boolean("is_default").notNull().default(false),

    /** Indica si la lista de precios está habilitada */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Código único de lista de precios */
    uniqueIndex("ux_catalogs_price_list_code").on(table.code),
  ]
));

export type PriceList = InferSelectModel<typeof priceList>;
export type NewPriceList = InferInsertModel<typeof priceList>;

export default priceList;
