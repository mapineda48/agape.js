import { vi } from "vitest";

// Re-export types from DTOs
export type {
    DeliverSalesOrderInput,
    DeliverSalesOrderResult,
    InvoiceSalesOrderInput,
    InvoiceDeliveryInput,
    SalesFlowInvoiceResult,
} from "@utils/dto/sales/flow";

// Mock functions
export const deliverSalesOrder = vi.fn();
export const invoiceSalesOrder = vi.fn();
export const invoiceDelivery = vi.fn();
