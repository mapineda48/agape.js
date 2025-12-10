import { vi } from "vitest";

// Re-export types from DTOs
export type {
  PurchaseOrderStatus,
  CreatePurchaseOrderInput,
  CreatePurchaseOrderItemInput,
  PurchaseOrderItem,
  PurchaseOrderItemWithProduct,
  PurchaseOrderWithItems,
  PurchaseOrderDetails,
  ListPurchaseOrdersParams,
  PurchaseOrderListItem,
  ListPurchaseOrdersResult,
  UpdatePurchaseOrderStatusInput,
  ReceivePurchaseOrderInput,
  ReceivePurchaseOrderItemInput,
  ReceivePurchaseOrderResult,
} from "@utils/dto/purchasing/purchase_order";

// Mock functions
export const createPurchaseOrder = vi.fn();
export const getPurchaseOrderById = vi.fn();
export const listPurchaseOrders = vi.fn();
export const updatePurchaseOrderStatus = vi.fn();
export const receivePurchaseOrder = vi.fn();
