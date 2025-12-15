import { vi } from "vitest";

// Re-export types from DTOs
export type {
    CreatePurchaseInvoiceInput,
    CreatePurchaseInvoiceItemInput,
    PurchaseInvoiceWithNumbering,
    PurchaseInvoiceDetails,
    ListPurchaseInvoicesParams,
    PurchaseInvoiceListItem,
    ListPurchaseInvoicesResult,
} from "@utils/dto/finance/purchase_invoice";

// Mock functions
export const createPurchaseInvoice = vi.fn();
export const getPurchaseInvoiceById = vi.fn();
export const listPurchaseInvoices = vi.fn();
