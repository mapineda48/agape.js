import schema from "../schema";
import { serial, varchar, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

/**
 * Unidad de Medida (Unit of Measure - UOM)
 *
 * Representa las unidades de medida base del sistema.
 * Ejemplos: Unidad, Kilogramo, Litro, Metro, Caja, etc.
 *
 * Esta tabla es referenciada por:
 * - inventory_item.uomId (UOM base del ítem inventariable)
 * - inventory_item_uom (conversiones entre UOMs para un ítem)
 */
export const unitOfMeasure = schema.table(
  "inventory_unit_of_measure",
  {
    /** Identificador único de la unidad de medida */
    id: serial("id").primaryKey(),

    /** Código interno de la UOM (ej: UN, KG, LT, MT, CJ) */
    code: varchar("code", { length: 10 }).notNull(),

    /** Nombre completo de la unidad de medida */
    fullName: varchar("full_name", { length: 50 }).notNull(),

    /** Descripción adicional (opcional) */
    description: varchar("description", { length: 200 }),

    /** Indica si la unidad de medida está habilitada */
    isEnabled: boolean("is_enabled").notNull().default(true),
  },
  (table) => [
    /** Código único de UOM */
    uniqueIndex("ux_inventory_unit_of_measure_code").on(table.code),
  ]
);

export type UnitOfMeasure = InferSelectModel<typeof unitOfMeasure>;
export type NewUnitOfMeasure = InferInsertModel<typeof unitOfMeasure>;

export default unitOfMeasure;
