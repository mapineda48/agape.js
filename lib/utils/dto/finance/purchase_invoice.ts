import type Decimal from "../../data/Decimal";
import type DateTime from "../../data/DateTime";

/**
 * Input para crear una factura de compra.
 */
export interface CreatePurchaseInvoiceItemInput {
  itemId: number;
  quantity: number;
  unitPrice: Decimal | number | string;
  /** ID de la línea de OC (opcional) */
  orderItemId?: number;
  /** ID de la línea de recepción (opcional) */
  goodsReceiptItemId?: number;
  /** ID del impuesto (opcional) */
  taxId?: number;
}

/**
 * Input para crear una factura de compra.
 */
export interface CreatePurchaseInvoiceInput {
  /** ID del proveedor */
  supplierId: number;
  /** Fecha de emisión (opcional, por defecto hoy) */
  issueDate?: DateTime;
  /** Fecha de vencimiento (opcional, si no se envía se calcula con paymentTerms) */
  dueDate?: DateTime | null;
  /** ID de términos de pago */
  paymentTermsId?: number;
  /** ID de la OC asociada (opcional) */
  purchaseOrderId?: number;
  /** ID de la recepción asociada (opcional) */
  goodsReceiptId?: number;
  /** Monto total de la factura (header total) */
  totalAmount: Decimal | number | string;
  /** Ítems de la factura */
  items: CreatePurchaseInvoiceItemInput[];
}

/**
 * Factura de compra con información de numeración.
 */
export interface PurchaseInvoiceWithNumbering {
  id: number;
  supplierId: number;
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
 * Factura de compra con datos completos para visualización.
 */
export interface PurchaseInvoiceDetails {
  id: number;
  supplierId: number;
  supplierName: string;
  supplierDocumentType: string | null;
  supplierDocumentNumber: string | null;
  issueDate: string;
  dueDate: string | null;
  totalAmount: Decimal;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
}

/**
 * Parámetros para listar facturas de compra.
 */
export interface ListPurchaseInvoicesParams {
  /** Filtro por ID de proveedor */
  supplierId?: number;
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
 * Ítem del listado de facturas de compra.
 */
export interface PurchaseInvoiceListItem {
  id: number;
  supplierId: number;
  supplierName: string;
  issueDate: string;
  totalAmount: Decimal;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
}

/**
 * Resultado del listado de facturas de compra.
 */
export interface ListPurchaseInvoicesResult {
  invoices: PurchaseInvoiceListItem[];
  totalCount?: number;
}
