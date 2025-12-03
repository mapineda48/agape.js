import { schema } from "../agape";
import { serial, integer } from "drizzle-orm/pg-core";
import { inventoryMovement } from "./movement";
import { product } from "./product";
import { location } from "./location";
import { decimal } from "../../lib/db/custom-types";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const inventoryMovementDetail = schema.table(
  "inventory_movement_detail",
  {
    id: serial("id").primaryKey(),
    movementId: integer("movement_id")
      .notNull()
      .references(() => inventoryMovement.id, { onDelete: "cascade" }),

    productId: integer("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),

    // si manejas stock por ubicación:
    locationId: integer("location_id").references(() => location.id, {
      onDelete: "restrict",
    }),

    quantity: integer("quantity").notNull(),
    // Opcional: costo o precio al momento del movimiento
    unitCost: decimal("unit_cost"),
  }
);

export type InventoryMovementDetail = InferSelectModel<
  typeof inventoryMovementDetail
>;
export type NewInventoryMovementDetail = InferInsertModel<
  typeof inventoryMovementDetail
>;

export default inventoryMovementDetail;
