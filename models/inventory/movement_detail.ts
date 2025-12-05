import { schema } from "../agape";
import { serial, integer } from "drizzle-orm/pg-core";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { inventoryMovement } from "./movement";
import { item } from "./item";
import { location } from "./location";
import { decimal } from "../../lib/db/custom-types";

export const inventoryMovementDetail = schema.table(
  "inventory_movement_detail",
  {
    id: serial("id").primaryKey(),

    movementId: integer("movement_id")
      .notNull()
      .references(() => inventoryMovement.id, { onDelete: "cascade" }),

    /** Ítem afectado (debe ser inventariable según reglas de negocio) */
    itemId: integer("item_id")
      .notNull()
      .references(() => item.id, { onDelete: "restrict" }),

    /** Ubicación (bodega) */
    locationId: integer("location_id").references(() => location.id, {
      onDelete: "restrict",
    }),

    /** Cantidad */
    quantity: integer("quantity").notNull(),

    /** Costo unitario en el momento del movimiento */
    unitCost: decimal("unit_cost"),
  }
);

export type InventoryMovementDetail = InferSelectModel<
  typeof inventoryMovementDetail
>;
export type NewInventoryMovementDetail = InferInsertModel<
  typeof inventoryMovementDetail
>;
