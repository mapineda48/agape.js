import { vi } from "vitest";

// Re-export types from DTOs
export type {
    PaymentType,
    PaymentStatus,
    CreatePaymentInput,
    PaymentWithNumbering,
    ListPaymentsParams,
    PaymentListItem,
    ListPaymentsResult,
} from "@utils/dto/finance/payment";

// Mock functions
export const createPayment = vi.fn();
export const getPaymentById = vi.fn();
export const listPayments = vi.fn();
export const postPayment = vi.fn();
export const cancelPayment = vi.fn();
export const allocatePayment = vi.fn();
