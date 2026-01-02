import type DateTime from "../../data/DateTime";
import type Decimal from "../../data/Decimal";

/**
 * Estados posibles de un movimiento de inventario.
 *
 * - draft: Borrador, no afecta stock. Puede editarse o eliminarse.
 * - posted: Contabilizado, afectó stock. No puede editarse, solo revertirse.
 * - cancelled: Cancelado mediante reversión. Mantiene trazabilidad.
 */
export type InventoryMovementStatus = "draft" | "posted" | "cancelled";

/**
 * Valores válidos para validación en runtime.
 */
export const INVENTORY_MOVEMENT_STATUS_VALUES: readonly InventoryMovementStatus[] =
  ["draft", "posted", "cancelled"];

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
 * El movimiento se crea en estado "draft" por defecto.
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
  /**
   * Si es true, el movimiento se crea Y se postea en una sola operación.
   * Útil para integraciones automatizadas (ej: GRN → Inventario).
   * @default false
   */
  autoPost?: boolean;
}

/**
 * Resultado de crear un movimiento de inventario.
 */
export interface CreateInventoryMovementResult {
  /** ID del movimiento creado */
  movementId: number;
  /** Número de documento formateado */
  documentNumber: string;
  /** Estado actual del movimiento */
  status: InventoryMovementStatus;
}

/**
 * Resultado de postear un movimiento de inventario.
 */
export interface PostInventoryMovementResult {
  /** ID del movimiento */
  movementId: number;
  /** Número de documento formateado */
  documentNumber: string;
  /** Estado anterior */
  previousStatus: InventoryMovementStatus;
  /** Estado nuevo (siempre "posted") */
  newStatus: "posted";
}

/**
 * Resultado de cancelar un movimiento de inventario.
 */
export interface CancelInventoryMovementResult {
  /** ID del movimiento cancelado */
  cancelledMovementId: number;
  /** Estado anterior del movimiento */
  previousStatus: InventoryMovementStatus;
  /** ID del movimiento de reversión (solo si previousStatus era "posted") */
  reversingMovementId?: number;
  /** Número del movimiento de reversión */
  reversingDocumentNumber?: string;
}

/**
 * Parámetros para listar movimientos de inventario.
 */
export interface ListInventoryMovementsParams {
  pageIndex?: number;
  pageSize?: number;
  movementTypeId?: number;
  startDate?: DateTime;
  endDate?: DateTime;
  fromDate?: DateTime;
  toDate?: DateTime;
  documentNumber?: string;
  status?: InventoryMovementStatus;
  includeTotalCount?: boolean;
}

/**
 * Item de la lista de movimientos.
 */
export interface InventoryMovementListItem {
  id: number;
  movementTypeId: number;
  movementTypeName: string;
  movementDate: DateTime;
  documentNumberFull: string;
  status: InventoryMovementStatus;
  observation?: string | null;
  employeeId: number;
  employeeName: string;
  sourceDocumentType?: string | null;
  sourceDocumentId?: number | null;
  /** Indica si es una reversión de otro movimiento */
  isReversal: boolean;
}

/**
 * Resultado de listar movimientos.
 */
export interface ListInventoryMovementsResult {
  movements: InventoryMovementListItem[];
  totalCount?: number;
}

