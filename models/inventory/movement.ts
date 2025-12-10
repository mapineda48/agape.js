import { schema } from "../agape";
import { serial, integer, varchar, uniqueIndex } from "drizzle-orm/pg-core";
import { inventoryMovementType } from "./movement_type";
import { dateTime } from "../../lib/db/custom-types";
import employee from "../hr/employee";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { documentSeries } from "../numbering/document_series";

export const inventoryMovement = schema.table(
  "inventory_movement",
  {
    id: serial("id").primaryKey(),

    movementTypeId: integer("movement_type_id")
      .notNull()
      .references(() => inventoryMovementType.id, { onDelete: "restrict" }),

    movementDate: dateTime("movement_date").notNull(),
    observation: varchar("observation", { length: 500 }),

    /**
     * Empleado responsable del movimiento.
     * Referencia al registro de employee, no al usuario del sistema.
     */
    employeeId: integer("employee_id")
      .references(() => employee.id)
      .notNull(),

    // Documento origen (opcional)
    sourceDocumentType: varchar("source_document_type", { length: 30 }),
    sourceDocumentId: integer("source_document_id"),

    /**
     * Serie de numeración utilizada para este movimiento.
     * Esto conecta el movimiento con el motor de numeración.
     */
    documentSeriesId: integer("document_series_id")
      .notNull()
      .references(() => documentSeries.id, { onDelete: "restrict" }),

    /**
     * Número interno asignado dentro de la serie.
     * Es el mismo que `assignedNumber` en document_sequence.
     */
    documentNumber: integer("document_number").notNull(),

    /**
     * Número completo formateado (prefijo + número + sufijo).
     * Se guarda como snapshot para auditoría (por si cambian prefijos/sufijos).
     */
    documentNumberFull: varchar("document_number_full", {
      length: 50,
    }).notNull(),
  },
  (table) => [
    /** Evita duplicar números dentro de la misma serie */
    uniqueIndex("ux_inventory_movement_series_number").on(
      table.documentSeriesId,
      table.documentNumber
    ),
  ]
);

export type InventoryMovement = InferSelectModel<typeof inventoryMovement>;
export type NewInventoryMovement = InferInsertModel<typeof inventoryMovement>;

export default inventoryMovement;
