import type Decimal from "../../data/Decimal";

/**
 * Input para crear una factura de compra.
 */
export interface CreatePurchaseInvoiceInput {
  /** ID del proveedor */
  supplierId: number;
  /** Fecha de emisión (opcional, por defecto hoy) */
  issueDate?: Date | string;
  /** Fecha de vencimiento (opcional) */
  dueDate?: Date | string | null;
  /** Monto total de la factura */
  totalAmount: Decimal | number | string;
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
