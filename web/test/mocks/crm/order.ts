import { vi } from "vitest";

// Re-export types from DTOs
export type {
    OrderStatus,
    CreateSalesOrderInput,
    CreateSalesOrderItemInput,
    SalesOrderWithNumbering,
    SalesOrderDetails,
    SalesOrderItemDetails,
    ListSalesOrdersParams,
    SalesOrderListItem,
    ListSalesOrdersResult,
    SalesOrderType,
} from "@utils/dto/crm/order";

export { ORDER_STATUS_VALUES } from "@utils/dto/crm/order";

// Mock functions
export const createSalesOrder = vi.fn();
export const getSalesOrderById = vi.fn();
export const listSalesOrders = vi.fn();
export const updateSalesOrderStatus = vi.fn();
export const listSalesOrderTypes = vi.fn();
