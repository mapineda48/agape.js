import type DateTime from "../../data/DateTime";

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
}

/**
 * Resultado del listado de órdenes de venta.
 */
export interface ListSalesOrdersResult {
  orders: SalesOrderListItem[];
  totalCount?: number;
}
