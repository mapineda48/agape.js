import type Decimal from "../../data/Decimal";
import type DateTime from "../../data/DateTime";

/**
 * Estados válidos para una factura de venta.
 */
export type SalesInvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "cancelled";

/**
 * Input para crear una línea de factura de venta.
 */
export interface CreateSalesInvoiceItemInput {
  /** ID del item del catálogo */
  itemId: number;
  /** Cantidad facturada */
  quantity: number | Decimal;
  /** Precio unitario */
  unitPrice: Decimal | number | string;
  /** ID de la línea de orden de venta (opcional) */
  orderItemId?: number;
  /** ID del impuesto (opcional) */
  taxId?: number;
  /** Porcentaje de descuento (opcional, default 0) */
  discountPercent?: number | Decimal;
  /** Descripción adicional (opcional) */
  description?: string;
}

/**
 * Input para crear una factura de venta.
 */
export interface CreateSalesInvoiceInput {
  /** ID del cliente */
  clientId: number;
  /** ID de la orden de venta asociada (opcional) */
  orderId?: number;
  /** Fecha de emisión (opcional, por defecto hoy) */
  issueDate?: DateTime;
  /** Fecha de vencimiento (opcional) */
  dueDate?: DateTime | null;
  /** ID de términos de pago (opcional) */
  paymentTermsId?: number;
  /** Líneas de la factura */
  items: CreateSalesInvoiceItemInput[];
  /** Porcentaje de descuento global (opcional, default 0) */
  globalDiscountPercent?: number | Decimal;
  /** Notas internas (opcional) */
  notes?: string;
}

/**
 * Factura de venta con información de numeración.
 */
export interface SalesInvoiceWithNumbering {
  id: number;
  clientId: number;
  orderId: number | null;
  issueDate: string;
  dueDate: string | null;
  status: SalesInvoiceStatus;
  /** Subtotal antes de descuentos e impuestos */
  subtotal: Decimal;
  /** Monto de descuento global */
  globalDiscountAmount: Decimal;
  /** Monto total de impuestos */
  taxAmount: Decimal;
  /** Total de la factura */
  totalAmount: Decimal;
  /** ID de la serie de numeración */
  seriesId: number;
  /** Número del documento en la serie */
  documentNumber: number;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
}

/**
 * Línea de factura de venta con datos calculados.
 */
export interface SalesInvoiceItemDetails {
  id: number;
  lineNumber: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: Decimal;
  unitPrice: Decimal;
  discountPercent: Decimal;
  discountAmount: Decimal;
  taxId: number | null;
  taxRate: Decimal | null;
  taxAmount: Decimal;
  subtotal: Decimal;
  total: Decimal;
  description: string | null;
}

/**
 * Factura de venta con datos completos para visualización.
 */
export interface SalesInvoiceDetails {
  id: number;
  orderId: number | null;
  orderDocumentNumber: string | null;
  clientId: number;
  clientName: string;
  clientDocumentType: string | null;
  clientDocumentNumber: string | null;
  status: SalesInvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  subtotal: Decimal;
  globalDiscountPercent: Decimal;
  globalDiscountAmount: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
  /** Número completo del documento (con prefijo/sufijo) */
  documentNumberFull: string;
  /** Líneas de la factura */
  items: SalesInvoiceItemDetails[];
  notes: string | null;
}

/**
 * Parámetros para listar facturas de venta.
 */
export interface ListSalesInvoicesParams {
  /** Filtro por ID de cliente */
  clientId?: number;
  /** Filtro por ID de orden de venta */
  orderId?: number;
  /** Filtro por estado */
  status?: SalesInvoiceStatus;
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
 * Ítem del listado de facturas de venta.
 */
export interface SalesInvoiceListItem {
  id: number;
  clientId: number;
  clientName: string;
  orderId: number | null;
  orderDocumentNumber: string | null;
  status: SalesInvoiceStatus;
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

/**
 * Resultado del posteo de una factura de venta.
 */
export interface PostSalesInvoiceResult {
  /** ID de la factura posteada */
  salesInvoiceId: number;
  /** Número completo del documento */
  documentNumberFull: string;
  /** Estado anterior de la factura */
  previousStatus: SalesInvoiceStatus;
  /** Nuevo estado de la factura (siempre 'issued') */
  newStatus: SalesInvoiceStatus;
  /** Subtotal calculado (suma de líneas antes de descuento global e impuestos) */
  subtotal: Decimal;
  /** Monto de descuento global aplicado */
  globalDiscountAmount: Decimal;
  /** Monto total de impuestos calculado */
  taxAmount: Decimal;
  /** Total calculado */
  totalAmount: Decimal;
}

/**
 * Información de la empresa para el PDF.
 */
export interface CompanyInfo {
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
}

/**
 * Detalle de un ítem de factura de venta para PDF/visualización.
 */
export interface SalesInvoiceItemPdfDetails {
  id: number;
  /** Número de línea */
  lineNumber: number;
  /** Código del producto */
  itemCode: string;
  /** Nombre completo del producto */
  itemName: string;
  /** Cantidad facturada */
  quantity: Decimal;
  /** Precio unitario */
  unitPrice: Decimal;
  /** Porcentaje de descuento */
  discountPercent: Decimal;
  /** Descuento aplicado */
  discountAmount: Decimal;
  /** Porcentaje de impuesto */
  taxRate: Decimal | null;
  /** Monto de impuesto */
  taxAmount: Decimal;
  /** Total de la línea */
  total: Decimal;
  /** Descripción adicional (opcional) */
  description: string | null;
}

/**
 * Datos completos de la factura de venta para generar PDF.
 */
export interface SalesInvoicePdfData {
  /** ID de la factura */
  id: number;
  /** Número de documento completo */
  documentNumberFull: string;
  /** Estado de la factura */
  status: SalesInvoiceStatus;
  /** Fecha de emisión (formato YYYY-MM-DD) */
  issueDate: string;
  /** Fecha de vencimiento (formato YYYY-MM-DD) */
  dueDate: string | null;
  /** Datos del cliente */
  client: {
    id: number;
    name: string;
    documentType: string | null;
    documentNumber: string | null;
    address?: string;
    phone?: string;
    email?: string;
  };
  /** Datos de la empresa (emisor) */
  company: CompanyInfo;
  /** Ítems de la factura */
  items: SalesInvoiceItemPdfDetails[];
  /** Subtotal (suma de subtotales de ítems) */
  subtotal: Decimal;
  /** Porcentaje de descuento global */
  globalDiscountPercent: Decimal;
  /** Monto de descuento global */
  globalDiscountAmount: Decimal;
  /** Total de impuestos */
  taxAmount: Decimal;
  /** Monto total de la factura */
  totalAmount: Decimal;
  /** Moneda */
  currency: string;
  /** Notas */
  notes: string | null;
}

/**
 * Input para enviar una factura de venta por correo electrónico.
 * El PDF se genera en el cliente y se envía como base64.
 */
export interface SendSalesInvoiceEmailInput {
  /** ID de la factura de venta */
  salesInvoiceId: number;
  /** Contenido del PDF en base64 */
  pdfBase64: string;
  /** Nombre del archivo PDF (opcional, default: "factura.pdf") */
  pdfFilename?: string;
}

/**
 * Resultado del envío de factura por correo.
 */
export interface SendSalesInvoiceEmailResult {
  /** Indica si el correo se envió correctamente */
  success: boolean;
  /** Email del destinatario */
  recipientEmail: string;
  /** Mensaje descriptivo */
  message: string;
}

