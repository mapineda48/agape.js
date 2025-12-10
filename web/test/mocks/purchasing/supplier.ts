import { vi } from "vitest";

// Re-export types from DTOs
export type {
  ListSuppliersParams,
  ListSuppliersResult,
  SupplierListItem,
  UpsertSupplierPayload,
  SupplierRecord,
  SupplierDetails,
} from "@utils/dto/purchasing/supplier";

// Mock functions
export const getSupplierById = vi.fn();
export const listSuppliers = vi.fn();
export const upsertSupplier = vi.fn();
export const deleteSupplier = vi.fn();
