import { schema } from "../schema";
import {
  serial,
  varchar,
  boolean,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Tipos de ubicación en la jerarquía de inventario.
 *
 * - WAREHOUSE: Bodega principal o almacén
 * - LOCATION: Zona o área dentro de la bodega
 * - BIN: Ubicación específica (estante, rack, etc.)
 */
export type LocationType = "WAREHOUSE" | "LOCATION" | "BIN";

/**
 * Ubicación de Inventario (Inventory Location)
 *
 * Soporta jerarquía de ubicaciones siguiendo el patrón estándar de ERPs:
 * - WAREHOUSE (Bodega) → LOCATION (Zona) → BIN (Estante/Rack)
 *
 * Ejemplo de jerarquía:
 * - Bodega Central (WAREHOUSE)
 *   ├── Zona A (LOCATION)
 *   │   ├── Estante A-1 (BIN)
 *   │   └── Estante A-2 (BIN)
 *   └── Zona B (LOCATION)
 *       └── Estante B-1 (BIN)
 */
export const location = schema.table(
  "inventory_location",
  {
    id: serial("id").primaryKey(),

    /** Nombre de la ubicación */
    name: varchar("name", { length: 80 }).notNull(),

    /**
     * Código interno único de la ubicación.
     * Ej: "BOD-CENTRAL", "ZONA-A", "A-1-01"
     */
    code: varchar("code", { length: 30 }).notNull(),

    /**
     * Tipo de ubicación en la jerarquía.
     * Determina el nivel: WAREHOUSE > LOCATION > BIN
     */
    type: varchar("type", { length: 20 })
      .notNull()
      .$type<LocationType>()
      .default("WAREHOUSE"),

    /**
     * Referencia al padre en la jerarquía (auto-referencia).
     * - NULL para bodegas raíz (WAREHOUSE)
     * - ID del padre para ubicaciones hijas (LOCATION, BIN)
     */
    parentLocationId: integer("parent_location_id"),

    /** Descripción adicional de la ubicación */
    description: varchar("description", { length: 200 }),

    /** Indica si la ubicación está habilitada para uso */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Código único de ubicación */
    uniqueIndex("ux_inventory_location_code").on(table.code),
    /** Índice para búsquedas por padre (jerarquía) */
    index("ix_inventory_location_parent").on(table.parentLocationId),
    /** Índice para filtrar por tipo */
    index("ix_inventory_location_type").on(table.type),
  ]
);

/**
 * Nota: La FK a parentLocationId no se define aquí para evitar
 * dependencia circular. Se puede agregar mediante ALTER TABLE
 * en la migración o validar en capa de servicio.
 */

export type Location = InferSelectModel<typeof location>;
export type NewLocation = InferInsertModel<typeof location>;

export default location;
