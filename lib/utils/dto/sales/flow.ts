import type Decimal from "../../data/Decimal";
import type DateTime from "../../data/DateTime";

/**
 * Input para entrega parcial o total de una orden de venta.
 */
export interface DeliverSalesOrderInput {
    orderId: number;
    /** Si no se proporciona, se asume la fecha actual */
    deliveryDate?: DateTime;
    /** Ubicación desde donde se despacha */
    locationId: number;
    /** Ítems a entregar. Si no se especifican, se asume todo lo pendiente. */
    items?: {
        orderItemId: number;
        quantity: number | string | Decimal;
    }[];
    /** Observaciones del despacho */
    observation?: string;
    /** ID del empleado que realiza el despacho */
    userId: number;
}

/**
 * Resultado de una operación de entrega.
 */
export interface DeliverSalesOrderResult {
    movementId: number;
    documentNumber: string;
}

/**
 * Input para facturar una orden de venta (Variante B: Servicios).
 */
export interface InvoiceSalesOrderInput {
    orderId: number;
    /** Si no se proporciona, se asume la fecha actual */
    invoiceDate?: DateTime;
    /** Ítems a facturar. Si no se especifican, se asume todo lo pendiente. */
    items?: {
        orderItemId: number;
        quantity: number | string | Decimal;
    }[];
    /** Notas de la factura */
    notes?: string;
}

/**
 * Input para facturar una entrega (Variante A: Inventario).
 */
export interface InvoiceDeliveryInput {
    movementId: number;
    /** Si no se proporciona, se asume la fecha actual */
    invoiceDate?: DateTime;
    /** Notas de la factura */
    notes?: string;
}

/**
 * Resultado de una operación de facturación.
 */
export interface SalesFlowInvoiceResult {
    invoiceId: number;
    documentNumber: string;
}
