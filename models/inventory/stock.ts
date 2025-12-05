import { schema } from "../agape";
import { integer, primaryKey } from "drizzle-orm/pg-core";
import inventoryItem from "./item";
import { location } from "./location";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Tabla de stock por ítem y ubicación.
 * Almacena la cantidad disponible de cada ítem inventariable en cada ubicación.
 *
 * Usa PK compuesto (item_id, location_id) para garantizar que no existan
 * duplicados de stock para la misma combinación ítem-ubicación.
 * Esto es el estándar en sistemas ERP para la gestión de inventario.
 */
export const stock = schema.table(
  "inventory_stock",
  {
    /** Referencia al ítem maestro inventariable */
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItem.itemId, { onDelete: "restrict" }),

    /**
     * Ubicación (bodega).
     * Nota: En este diseño location_id es NOT NULL para la PK compuesta.
     * Si necesitas stock sin ubicación, crea una ubicación "default" o "sin asignar".
     */
    locationId: integer("location_id")
      .notNull()
      .references(() => location.id, { onDelete: "restrict" }),

    /** Cantidad disponible */
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    /**
     * PK compuesto: garantiza unicidad de (item_id, location_id).
     * Esto es el patrón estándar en ERPs para tablas de stock.
     */
    primaryKey({ columns: [table.itemId, table.locationId] }),
  ]
);

export type Stock = InferSelectModel<typeof stock>;
export type NewStock = InferInsertModel<typeof stock>;

export default stock;
