import { vi } from "vitest";

export type {
    PaymentMethodDto,
    CreatePaymentMethodDto,
} from "@utils/dto/finance/payment_method";

export const createPaymentMethod = vi.fn();
export const updatePaymentMethod = vi.fn();
export const deletePaymentMethod = vi.fn();
export const getPaymentMethodById = vi.fn();
export const listPaymentMethods = vi.fn();
