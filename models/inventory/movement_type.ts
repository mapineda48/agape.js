import { schema } from "../agape";
import { serial, varchar, smallint, boolean } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const inventoryMovementType = schema.table("inventory_movement_type", {
  id: serial("id").primaryKey(),
  /** Nombre del movimiento (Entrada por compra, Salida por venta, Ajuste, etc.) */
  name: varchar("name", { length: 80 }).notNull(),
  /** +1 para entradas, -1 para salidas */
  factor: smallint("factor").notNull(), // 1 o -1
  /** Si afecta stock (ej: movimientos administrativos que no modifican existencia) */
  affectsStock: boolean("affects_stock").notNull(),
  /** Habilitado / deshabilitado en catálogo */
  isEnabled: boolean("is_enabled").notNull(),
});

export type InventoryMovementType = InferSelectModel<
  typeof inventoryMovementType
>;
export type NewInventoryMovementType = InferInsertModel<
  typeof inventoryMovementType
>;

export default inventoryMovementType;
