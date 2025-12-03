import { schema } from "../agape";
import { serial, integer, varchar } from "drizzle-orm/pg-core";
import { inventoryMovementType } from "./movement_type";
import { dateTime } from "../../lib/db/custom-types";
import employee from "../staff/employee";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const inventoryMovement = schema.table("inventory_movements", {
  id: serial("id").primaryKey(),

  movementTypeId: integer("movement_type_id")
    .notNull()
    .references(() => inventoryMovementType.id, { onDelete: "restrict" }),

  movementDate: dateTime("movement_date").notNull(), // o timestamp
  observation: varchar("observation", { length: 500 }),
  userId: integer("user_id")
    .references(() => employee.id)
    .notNull(), // o varchar si usas otro identificador

  // Opcional: referencia al documento origen (factura, orden de compra, etc.)
  sourceDocumentType: varchar("source_document_type", { length: 30 }),
  sourceDocumentId: integer("source_document_id"),
});

export type InventoryMovement = InferSelectModel<typeof inventoryMovement>;
export type NewInventoryMovement = InferInsertModel<typeof inventoryMovement>;

export default inventoryMovement;
