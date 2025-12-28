import { vi } from "vitest";

// Re-export types from DTOs
export type {
    SalesInvoiceStatus,
    CreateSalesInvoiceItemInput,
    CreateSalesInvoiceInput,
    SalesInvoiceWithNumbering,
    SalesInvoiceItemDetails,
    SalesInvoiceDetails,
    ListSalesInvoicesParams,
    SalesInvoiceListItem,
    ListSalesInvoicesResult,
    PostSalesInvoiceResult,
    SalesInvoicePdfData,
    SalesInvoiceItemPdfDetails,
    CompanyInfo,
} from "@utils/dto/finance/sales_invoice";

// Mock functions
export const createSalesInvoice = vi.fn();
export const getSalesInvoiceById = vi.fn();
export const listSalesInvoices = vi.fn();
export const postSalesInvoice = vi.fn();
export const getSalesInvoiceForPdf = vi.fn();

