import type DateTime from "../../data/DateTime";
import type Decimal from "../../data/Decimal";

/**
 * Estados posibles de una orden de venta.
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * Valores válidos para validación en runtime.
 */
export const ORDER_STATUS_VALUES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

/**
 * Input para una línea de orden de venta.
 */
export interface CreateSalesOrderItemInput {
  /** ID del ítem del catálogo */
  itemId: number;
  /** Cantidad solicitada */
  quantity: number | string | Decimal;
  /** Precio unitario pactado */
  unitPrice: number | string | Decimal;
  /** Porcentaje de descuento por línea (opcional) */
  discountPercent?: number | string | Decimal;
  /** Notas adicionales por línea (opcional) */
  notes?: string;
}

/**
 * Input para crear una orden de venta.
 */
export interface CreateSalesOrderInput {
  /** ID del cliente */
  clientId: number;
  /** ID del tipo de orden */
  orderTypeId: number;
  /** Fecha de la orden (opcional, por defecto hoy) */
  orderDate?: DateTime;
  /** Estado de la orden (opcional, por defecto 'pending') */
  status?: OrderStatus;
  /** Líneas de la orden */
  items: CreateSalesOrderItemInput[];
  /** Notas generales (opcional) */
  notes?: string;
  /** Términos de pago (opcional) */
  paymentTermsId?: number;
  /** Lista de precios (opcional) */
  priceListId?: number;
}

/**
 * Orden de venta con información de numeración.
 */
export interface SalesOrderWithNumbering {
  id: number;
  clientId: number;
  orderTypeId: number;
  orderDate: string;
  status: OrderStatus;
  disabled: boolean;
  /** ID de la serie de numeración */
  seriesId: number;
  /** Número del documento en la serie */
  documentNumber: number;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
  /** Total de la orden */
  total: Decimal;
}

/**
 * Detalle de una línea de orden de venta.
 */
export interface SalesOrderItemDetails {
  id: number;
  lineNumber: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: Decimal;
  unitPrice: Decimal;
  discountPercent: Decimal;
  discountAmount: Decimal;
  taxPercent: Decimal;
  taxAmount: Decimal;
  subtotal: Decimal;
  total: Decimal;
  notes: string | null;
  deliveredQuantity: Decimal;
  invoicedQuantity: Decimal;
}

/**
 * Orden de venta con datos completos para visualización.
 */
export interface SalesOrderDetails {
  id: number;
  clientId: number;
  clientName: string;
  clientDocumentType: string | null;
  clientDocumentNumber: string | null;
  orderTypeId: number;
  orderDate: string;
  status: OrderStatus;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
  disabled: boolean;
  subtotal: Decimal;
  taxAmount: Decimal;
  total: Decimal;
  notes: string | null;
  items: SalesOrderItemDetails[];
}

/**
 * Parámetros para listar órdenes de venta.
 */
export interface ListSalesOrdersParams {
  /** Filtro por ID de cliente */
  clientId?: number;
  /** Filtro por ID de tipo de orden */
  orderTypeId?: number;
  /** Filtro por estado de la orden */
  status?: OrderStatus;
  /** Fecha de inicio del rango */
  fromDate?: DateTime;
  /** Fecha de fin del rango */
  toDate?: DateTime;
  /** Si es true, incluye el conteo total de registros */
  includeTotalCount?: boolean;
  /** Índice de página (0-based) */
  pageIndex?: number;
  /** Tamaño de página */
  pageSize?: number;
}

/**
 * Ítem del listado de órdenes de venta.
 */
export interface SalesOrderListItem {
  id: number;
  clientId: number;
  clientName: string;
  orderTypeId: number;
  orderDate: string;
  status: OrderStatus;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
  /** Total de la orden */
  total: Decimal;
  deliveredPercent: number;
  invoicedPercent: number;
}

/**
 * Resultado del listado de órdenes de venta.
 */
export interface ListSalesOrdersResult {
  orders: SalesOrderListItem[];
  totalCount?: number;
}

/**
 * Representa un tipo de orden de venta (ej: Online, Mostrador).
 */
export interface SalesOrderType {
  id: number;
  name: string;
  disabled: boolean;
}
