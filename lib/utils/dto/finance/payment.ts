import type DateTime from "../../data/DateTime";
import type Decimal from "../../data/Decimal";

/**
 * Tipo de pago.
 */
export type PaymentType = "receipt" | "disbursement";

/**
 * Estado del pago.
 */
export type PaymentStatus = "draft" | "posted" | "cancelled";

/**
 * Input para crear un pago.
 */
export interface CreatePaymentInput {
    /** receipt para cobro a cliente, disbursement para pago a proveedor */
    type: PaymentType;
    /** ID del usuario (cliente o proveedor) */
    userId: number;
    paymentMethodId: number;
    paymentDate?: DateTime;
    amount: number | string | Decimal;
    currencyCode?: string;
    exchangeRate?: number | string | Decimal;
    reference?: string;
    notes?: string;
    /** 
     * Asignaciones opcionales al momento de crear el pago.
     * Si no se proporcionan, el pago queda con 'unallocatedAmount' total.
     */
    allocations?: {
        invoiceId: number;
        amount: number | string | Decimal;
    }[];
}

/**
 * Resultado de creación de pago.
 */
export interface PaymentWithNumbering {
    id: number;
    documentNumberFull: string;
    amount: Decimal;
    unallocatedAmount: Decimal;
    status: PaymentStatus;
}

export interface ListPaymentsParams {
    userId?: number;
    type?: PaymentType;
    status?: PaymentStatus;
    fromDate?: DateTime;
    toDate?: DateTime;
    pageIndex?: number;
    pageSize?: number;
    includeTotalCount?: boolean;
}

export interface PaymentListItem {
    id: number;
    documentNumberFull: string;
    paymentType: PaymentType;
    userId: number;
    userName: string;
    paymentDate: string;
    amount: Decimal;
    unallocatedAmount: Decimal;
    status: PaymentStatus;
}

export interface ListPaymentsResult {
    payments: PaymentListItem[];
    totalCount?: number;
}
