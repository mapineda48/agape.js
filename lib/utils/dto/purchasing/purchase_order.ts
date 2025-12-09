import type DateTime from "../../data/DateTime";
import type Decimal from "../../data/Decimal";

/**
 * Estados posibles de una orden de compra.
 */
export type PurchaseOrderStatus =
  | "pending"
  | "approved"
  | "received"
  | "cancelled";

/**
 * Valores válidos para validación en runtime.
 */
export const PURCHASE_ORDER_STATUS_VALUES: readonly PurchaseOrderStatus[] = [
  "pending",
  "approved",
  "received",
  "cancelled",
];

/**
 * Input para un ítem de orden de compra.
 */
export interface CreatePurchaseOrderItemInput {
  /** ID del ítem del catálogo de inventario */
  itemId: number;
  /** Cantidad a ordenar */
  quantity: number;
  /** Precio unitario */
  unitPrice: Decimal | number | string;
}

/**
 * Input para crear una orden de compra.
 */
export interface CreatePurchaseOrderInput {
  /** ID del proveedor */
  supplierId: number;
  /** Fecha de la orden (opcional, por defecto hoy) */
  orderDate?: DateTime | Date;
  /** Estado de la orden (opcional, por defecto 'pending') */
  status?: PurchaseOrderStatus;
  /** Lista de ítems a ordenar */
  items: CreatePurchaseOrderItemInput[];
}

/**
 * Ítem de una orden de compra almacenado.
 */
export interface PurchaseOrderItem {
  id: number;
  purchaseOrderId: number;
  itemId: number;
  quantity: number;
  unitPrice: Decimal;
}

/**
 * Ítem de orden de compra con datos del catálogo.
 */
export interface PurchaseOrderItemWithProduct extends PurchaseOrderItem {
  itemCode: string;
  itemName: string;
  subtotal: Decimal;
}

/**
 * Orden de compra con sus ítems.
 */
export interface PurchaseOrderWithItems {
  id: number;
  supplierId: number;
  orderDate: DateTime;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
}

/**
 * Orden de compra con datos completos para visualización.
 */
export interface PurchaseOrderDetails {
  id: number;
  supplierId: number;
  supplierName: string;
  supplierDocumentType: string | null;
  supplierDocumentNumber: string | null;
  orderDate: DateTime;
  status: PurchaseOrderStatus;
  totalAmount: Decimal;
  items: PurchaseOrderItemWithProduct[];
}

/**
 * Parámetros para listar órdenes de compra.
 */
export interface ListPurchaseOrdersParams {
  /** Filtro por ID de proveedor */
  supplierId?: number;
  /** Filtro por estado de la orden */
  status?: PurchaseOrderStatus;
  /** Fecha de inicio del rango */
  fromDate?: DateTime | Date;
  /** Fecha de fin del rango */
  toDate?: DateTime | Date;
  /** Si es true, incluye el conteo total de registros */
  includeTotalCount?: boolean;
  /** Índice de página (0-based) */
  pageIndex?: number;
  /** Tamaño de página */
  pageSize?: number;
}

/**
 * Ítem del listado de órdenes de compra.
 */
export interface PurchaseOrderListItem {
  id: number;
  supplierId: number;
  supplierName: string;
  orderDate: DateTime;
  status: PurchaseOrderStatus;
  totalAmount: Decimal;
  itemCount: number;
}

/**
 * Resultado del listado de órdenes de compra.
 */
export interface ListPurchaseOrdersResult {
  orders: PurchaseOrderListItem[];
  totalCount?: number;
}

/**
 * Input para actualizar el estado de una orden de compra.
 */
export interface UpdatePurchaseOrderStatusInput {
  /** ID de la orden de compra */
  orderId: number;
  /** Nuevo estado */
  status: PurchaseOrderStatus;
}

/**
 * Input para recibir una orden de compra (genera movimiento de entrada).
 */
export interface ReceivePurchaseOrderInput {
  /** ID de la orden de compra */
  orderId: number;
  /** ID de la ubicación de inventario donde se recibirá */
  locationId: number;
  /** ID del empleado que recibe */
  receivedById: number;
  /** Observaciones del movimiento */
  observation?: string;
  /** Ítems recibidos (si difiere de lo ordenado) */
  receivedItems?: ReceivePurchaseOrderItemInput[];
}

/**
 * Input para un ítem recibido en una orden de compra.
 * Permite registrar cantidades diferentes a las ordenadas.
 */
export interface ReceivePurchaseOrderItemInput {
  /** ID del ítem en la orden (purchasing_order_item.id) */
  orderItemId: number;
  /** Cantidad recibida (puede ser menor o igual a la ordenada) */
  receivedQuantity: number;
  /** Costo unitario al momento de la recepción */
  unitCost?: Decimal | number | string;
}

/**
 * Resultado de la recepción de una orden de compra.
 */
export interface ReceivePurchaseOrderResult {
  /** Orden de compra actualizada */
  order: PurchaseOrderWithItems;
  /** ID del movimiento de inventario generado */
  inventoryMovementId: number;
  /** Número completo del documento de movimiento */
  movementNumber: string;
}
