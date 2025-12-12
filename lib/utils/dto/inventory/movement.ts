import type DateTime from "../../data/DateTime";
import type Decimal from "../../data/Decimal";

/**
 * Detalle de un movimiento de inventario.
 */
export interface CreateInventoryMovementDetail {
  /** ID del ítem (debe existir en inventory_item) */
  itemId: number;
  /** ID de la ubicación (opcional) */
  locationId?: number | null;
  /** ID del lote (opcional, para ítems controlados por lote) */
  lotId?: number | null;
  /**
   * Número de lote (alternativa a lotId).
   * Si se provee lotNumber en lugar de lotId, el servicio buscará
   * o creará el lote automáticamente.
   */
  lotNumber?: string | null;
  /**
   * Fecha de expiración del lote (opcional, solo usado si se crea lote nuevo).
   */
  lotExpirationDate?: DateTime | null;
  /** ID de la unidad de medida (si difiere de la base) */
  uomId?: number | null;
  /** Cantidad del movimiento (visual, en la UOM especificada) */
  quantity: number;
  /** Costo unitario (opcional, si se provee explícitamente) */
  unitCost?: Decimal | null;
}

/**
 * Input para crear un movimiento de inventario.
 */
export interface CreateInventoryMovementInput {
  /** ID del tipo de movimiento */
  movementTypeId: number;
  /** Fecha del movimiento */
  movementDate: DateTime;
  /** Observación opcional */
  observation?: string | null;
  /** ID del usuario que realiza el movimiento */
  userId: number;
  /** Tipo de documento origen (opcional) */
  sourceDocumentType?: string | null;
  /** ID del documento origen (opcional) */
  sourceDocumentId?: number | null;
  /** Detalles del movimiento */
  details: CreateInventoryMovementDetail[];
}
