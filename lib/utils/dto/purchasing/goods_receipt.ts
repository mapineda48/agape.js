import type Decimal from "../../data/Decimal";
import type DateTime from "../../data/DateTime";

/**
 * Estado del documento de recepción.
 */
export type GoodsReceiptStatus = "draft" | "posted" | "cancelled";

/**
 * Valores válidos de estado.
 */
export const GOODS_RECEIPT_STATUS_VALUES: readonly GoodsReceiptStatus[] = [
  "draft",
  "posted",
  "cancelled",
];

/**
 * Input para crear una línea de recepción.
 */
export interface CreateGoodsReceiptItemInput {
  itemId: number;
  /** Cantidad recibida */
  quantity: number;
  /** Costo unitario (si no se envía, se toma de la OC o ítem) */
  unitCost?: Decimal | number | string;
  /** Ubicación donde se almacena */
  locationId?: number;
  /** ID de la línea de OC (opcional para trazabilidad) */
  orderItemId?: number;
  /** Número de lote */
  lotNumber?: string;
  /** Observaciones */
  observation?: string;
}

/**
 * Input para crear una recepción de mercancía.
 */
export interface CreateGoodsReceiptInput {
  supplierId: number;
  /** ID de la orden de compra asociada (opcional) */
  purchaseOrderId?: number;
  /** Fecha de recepción (default: hoy) */
  receiptDate?: DateTime;
  /** Observaciones generales */
  observation?: string;
  /** Usuario que recibe (si no se pasa, se inferirá del contexto o required) */
  receivedByUserId: number;
  /** Ítems recibidos */
  items: CreateGoodsReceiptItemInput[];
}

/**
 * Detalles de un ítem de recepción.
 */
export interface GoodsReceiptItemDetails {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitCost: Decimal;
  locationId: number | null;
  locationName: string | null;
  lotNumber: string | null;
  subtotal: Decimal;
}

/**
 * Detalles completos de una recepción.
 */
export interface GoodsReceiptDetails {
  id: number;
  documentNumberFull: string;
  status: GoodsReceiptStatus;
  receiptDate: string; // ISO string
  supplierId: number;
  supplierName: string;
  purchaseOrderId: number | null;
  observation: string | null;
  receivedByUserId: number;
  receivedByName: string;
  items: GoodsReceiptItemDetails[];
  totalAmount: Decimal; // Suma de costos
}

/**
 * Resultado de postear una recepción.
 */
export interface PostGoodsReceiptResult {
  goodsReceiptId: number;
  inventoryMovementId: number;
  inventoryMovementNumber: string;
  isPurchaseOrderClosed: boolean;
}
