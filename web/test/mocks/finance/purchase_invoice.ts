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
    PurchaseInvoiceItemDetails,
    PurchaseInvoicePdfData,
    CompanyInfo,
} from "@utils/dto/finance/purchase_invoice";

// Mock functions
export const createPurchaseInvoice = vi.fn();
export const getPurchaseInvoiceById = vi.fn();
export const listPurchaseInvoices = vi.fn();
export const getPurchaseInvoiceForPdf = vi.fn();

