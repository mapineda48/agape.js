import type Decimal from "../../data/Decimal";

/**
 * Input para crear una factura de venta.
 */
export interface CreateSalesInvoiceInput {
  /** ID de la orden de venta asociada */
  orderId: number;
  /** Fecha de emisión (opcional, por defecto hoy) */
  issueDate?: Date | string;
  /** Fecha de vencimiento (opcional) */
  dueDate?: Date | string | null;
  /** Monto total de la factura */
  totalAmount: Decimal | number | string;
}

/**
 * Factura de venta con información de numeración.
 */
export interface SalesInvoiceWithNumbering {
  id: number;
  orderId: number;
  issueDate: string;
  dueDate: string | null;
  totalAmount: Decimal;
  /** ID de la serie de numeración */
  seriesId: number;
  /** Número del documento en la serie */
  documentNumber: number;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
}

/**
 * Factura de venta con datos completos para visualización.
 */
export interface SalesInvoiceDetails {
  id: number;
  orderId: number;
  orderDocumentNumber: string;
  clientId: number;
  clientName: string;
  clientDocumentType: string | null;
  clientDocumentNumber: string | null;
  issueDate: string;
  dueDate: string | null;
  totalAmount: Decimal;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
}

/**
 * Parámetros para listar facturas de venta.
 */
export interface ListSalesInvoicesParams {
  /** Filtro por ID de orden de venta */
  orderId?: number;
  /** Fecha de inicio del rango */
  fromDate?: Date | string;
  /** Fecha de fin del rango */
  toDate?: Date | string;
  /** Si es true, incluye el conteo total de registros */
  includeTotalCount?: boolean;
  /** Índice de página (0-based) */
  pageIndex?: number;
  /** Tamaño de página */
  pageSize?: number;
}

/**
 * Ítem del listado de facturas de venta.
 */
export interface SalesInvoiceListItem {
  id: number;
  orderId: number;
  orderDocumentNumber: string;
  clientName: string;
  issueDate: string;
  totalAmount: Decimal;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
}

/**
 * Resultado del listado de facturas de venta.
 */
export interface ListSalesInvoicesResult {
  invoices: SalesInvoiceListItem[];
  totalCount?: number;
}
